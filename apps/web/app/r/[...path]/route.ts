import type { NextRequest } from "next/server"
import { searchItems } from "@/lib/search-utils"
import type { IndexedItem } from "@/lib/items-index"
import { loadCatalog, type Catalog, type CatalogItem } from "@/lib/catalog"
import { registryFetch } from "@/lib/fetch-utils"

// Aggregated shadcn registry endpoint (dynamic search protocol):
//
//   GET /r/registry.json                → full catalog (static ingesters)
//   GET /r/registry.json?q=&type=&limit=&offset= → server-side search with
//       a pagination object; the shadcn CLI trusts our ranking end-to-end
//   GET /r/{handle}/{item}.json         → item JSON proxied from the origin
//       registry (the CLI resolves installs through the same namespace
//       that answered the search)
//
// Configure as: "@registrydirectory": "https://registry.directory/r/{name}.json"

export const dynamic = "force-dynamic"

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 1000
// Scoring cost is items × query terms; an unbounded q would let a single
// request buy arbitrary CPU. 200 chars covers any real component search.
const MAX_QUERY_LENGTH = 200

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
  // Cached per full URL (query included) at the CDN; the daily rebuild
  // rewrites the blob, so stale answers converge within the hour.
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
} as const

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

// searchItems scores IndexedItem.name — feed it the ORIGINAL item name so
// exact matches keep their bonus, and carry the catalog item alongside.
type SearchableItem = IndexedItem & { catalogItem: CatalogItem }

const searchableCache = new WeakMap<Catalog, SearchableItem[]>()

function searchables(catalog: Catalog): SearchableItem[] {
  let list = searchableCache.get(catalog)
  if (!list) {
    list = catalog.items.map((item) => ({
      name: item.name,
      type: item.type,
      description: item.description,
      categories: item.categories,
      registry: {
        name: item.registryName,
        basePath: `/${item.handle}`,
        avatarUrl: null,
      },
      catalogItem: item,
    }))
    searchableCache.set(catalog, list)
  }
  return list
}

function publicItem(item: CatalogItem) {
  return {
    name: item.namespaced,
    type: item.type,
    description: item.description
      ? `[${item.registryName}] ${item.description}`
      : `[${item.registryName}]`,
  }
}

function catalogResponse(catalog: Catalog, request: NextRequest): Response {
  const params = request.nextUrl.searchParams
  const q = params.get("q")?.trim().slice(0, MAX_QUERY_LENGTH)
  const typeParam = params.get("type")
  const hasSearchParams =
    params.has("q") || params.has("type") || params.has("limit") || params.has("offset")

  let results: CatalogItem[]
  if (q) {
    results = (searchItems(searchables(catalog), q) as SearchableItem[]).map(
      (s) => s.catalogItem
    )
  } else {
    results = catalog.items
  }

  if (typeParam) {
    const types = new Set(
      typeParam
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith("registry:") ? t : `registry:${t}`))
    )
    results = results.filter((item) => types.has(item.type))
  }

  const limit = hasSearchParams
    ? Math.min(Math.max(Number(params.get("limit")) || DEFAULT_LIMIT, 1), MAX_LIMIT)
    : results.length
  const offset = Math.max(Number(params.get("offset")) || 0, 0)
  const page = results.slice(offset, offset + limit)

  return jsonResponse({
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "registry.directory",
    homepage: "https://registry.directory",
    items: page.map(publicItem),
    pagination: {
      total: results.length,
      offset,
      limit,
      hasMore: offset + limit < results.length,
    },
  })
}

async function itemResponse(catalog: Catalog, namespaced: string): Promise<Response> {
  const item = catalog.items.find((i) => i.namespaced === namespaced)
  if (!item) {
    return jsonResponse(
      { error: `Item "${namespaced}" not found in the registry.directory catalog.` },
      404
    )
  }

  const registry = catalog.registries[item.handle]
  if (!registry) {
    return jsonResponse(
      { error: `Origin registry for "${namespaced}" is not resolvable.` },
      404
    )
  }
  const originUrl = `${registry.itemBase}/${item.name}.json`

  try {
    const response = await registryFetch(originUrl, {
      timeout: 10000,
      next: { revalidate: 86400 },
    })

    if (!response.ok) {
      const status = response.status === 404 ? 404 : 502
      return jsonResponse(
        {
          error: `Origin registry "${item.registryName}" responded ${response.status} for "${item.name}".`,
        },
        status
      )
    }

    const originItem = (await response.json()) as Record<string, unknown>
    // Keep the identity the search result promised. registryDependencies
    // pass through untouched: a plain dep name natively resolves to
    // @shadcn, never to the origin registry — same semantics as a direct
    // URL install.
    originItem.name = namespaced
    return jsonResponse(originItem)
  } catch {
    return jsonResponse(
      { error: `Failed to reach origin registry "${item.registryName}".` },
      502
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path } = await params
  const joined = path.join("/")

  const catalog = await loadCatalog()
  if (!catalog) {
    return jsonResponse({ error: "Catalog unavailable, try again shortly." }, 503)
  }

  if (joined === "registry.json" || joined === "registry") {
    return catalogResponse(catalog, request)
  }

  const namespaced = joined.replace(/\.json$/, "")
  return itemResponse(catalog, namespaced)
}

export function OPTIONS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
