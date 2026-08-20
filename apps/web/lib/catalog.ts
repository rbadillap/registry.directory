import type { DirectoryEntry } from "./types"
import { loadRegistryView } from "./registry-data"
import { loadDirectory, parseGithubRef, entryHandle } from "./resolve-registry"

// Aggregated cross-registry catalog served at /r/registry.json (shadcn
// dynamic search protocol) and backing the /r/{handle}/{item}.json proxy.
//
// BAD-138: assembled from the views committed under data/registries. It used
// to be built during the Vercel build by fetching all 75 origin indexes plus
// three probe requests each, then written to Vercel Blob and read back at
// request time. Both halves are gone — the indexer already did that work, and
// a blob that only the build refreshes goes stale the moment builds stop.
//
// Assembly is sequential on purpose: one view is parsed and reduced to its
// catalog fields before the next is opened, so peak memory is a single
// registry rather than all of them.

const MEMORY_TTL_MS = 60 * 60 * 1000
const DESCRIPTION_MAX = 300

export interface CatalogItem {
  // Original item name at the origin registry — used for relevance
  // scoring and to build the origin fetch URL.
  name: string
  // Public identity through the aggregator: "{handle}/{name}". This is
  // what the CLI sees and what @namespace/{...} resolves to.
  namespaced: string
  type: string
  description: string
  categories: string[]
  registryName: string
  handle: string
}

export interface CatalogRegistry {
  name: string
  // Base URL for individual item JSONs at the origin: `${itemBase}/{name}.json`
  itemBase: string
}

export interface Catalog {
  generatedAt: string
  registries: Record<string, CatalogRegistry>
  items: CatalogItem[]
}

function catalogHandle(entry: DirectoryEntry): string | null {
  const handle = entryHandle(entry)
  if (handle) return handle.toLowerCase()
  const gh = parseGithubRef(entry.github_url)
  return gh ? gh.owner.toLowerCase() : null
}

export async function buildCatalog(): Promise<Catalog> {
  const entries = await loadDirectory()

  const registries: Record<string, CatalogRegistry> = {}
  const items: CatalogItem[] = []

  for (const entry of entries) {
    const handle = catalogHandle(entry)
    if (!handle) continue

    const view = await loadRegistryView(entry)
    if (!view?.items?.length) continue

    // A registry whose sampled items all failed definitively at the origin is
    // fully gated or broken — listing it would turn every install into our
    // 502. The sampling happens in the indexer (scripts/steps/registries.mjs);
    // the build only reads the verdict.
    if (!view.resolvable) continue

    if (registries[handle]) {
      console.log(`[catalog] Duplicate handle ${handle}, keeping first`)
      continue
    }
    registries[handle] = { name: entry.name, itemBase: view.itemBase }

    const seen = new Set<string>()
    for (const item of view.items) {
      if (seen.has(item.name)) continue
      seen.add(item.name)
      items.push({
        name: item.name,
        namespaced: `${handle}/${item.name}`,
        type: item.type || "registry:item",
        description: (item.description || "").slice(0, DESCRIPTION_MAX),
        categories: item.categories || [],
        registryName: entry.name,
        handle,
      })
    }
  }

  console.log(
    `[catalog] Built ${items.length} items from ${Object.keys(registries).length} registries`
  )

  return { generatedAt: new Date().toISOString(), registries, items }
}

let memory: { catalog: Catalog; at: number } | null = null

export async function loadCatalog(): Promise<Catalog | null> {
  if (memory && Date.now() - memory.at < MEMORY_TTL_MS) {
    return memory.catalog
  }

  let catalog: Catalog
  try {
    catalog = await buildCatalog()
  } catch (error) {
    console.error("[catalog] Build failed:", error)
    return memory?.catalog ?? null
  }

  if (!catalog.items.length) return memory?.catalog ?? null

  memory = { catalog, at: Date.now() }
  return catalog
}
