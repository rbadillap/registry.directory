import type { DirectoryEntry } from "./types"
import type { RegistryFontItem } from "./registry-types"
import { loadRegistryView } from "./registry-data"
import { loadDirectory, parseGithubRef, entryHandle } from "./resolve-registry"

// Aggregated cross-registry catalog served at /r/registry.json (shadcn
// dynamic search protocol) and backing the /r/{handle}/{item}.json proxy.
//
// Assembled at request time from the views committed under data/registries.
// Neither half of the work costs anything here: the indexer has already
// fetched and probed every origin, and deriving the catalog from those files
// keeps it in step with the pages it links to, which a separately stored copy
// could not guarantee.
//
// Assembly is sequential on purpose: one view is parsed and reduced to its
// catalog fields before the next is opened, so peak memory is a single
// registry rather than all of them.

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
  // Only on registry:font items. The schema makes it mandatory for that
  // type, so it has to travel with the catalog entry, not just the item.
  font?: RegistryFontItem["font"]
}

// Not listed in /r. The CLI's schema admits both types, but marks them
// "internal use only" and the published JSON schema rejects them: they are
// a registry's own demos and scaffolding, not something to install through
// an aggregator.
const INTERNAL_TYPES = new Set(["registry:example", "registry:internal"])

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
  const skipped = { internal: 0, fontWithoutMetadata: 0, unavailable: 0 }

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

      const type = item.type || "registry:item"
      if (INTERNAL_TYPES.has(type)) {
        skipped.internal++
        continue
      }

      // The origin refused this item when the indexer asked for it — a
      // paywall, a login, or a 404 behind a stale index. Listed, it would be
      // a search result that installs as our 502, and the official registry
      // index samples this catalog daily and scores each one against us.
      // The site still shows the item; only the CLI-facing catalog omits it.
      if (item.unavailable) {
        skipped.unavailable++
        continue
      }

      // A font the origin lists without its metadata is not installable
      // through anyone, and one such entry makes the CLI reject the whole
      // catalog page it appears on. Leave it out rather than break the page.
      const font = item.type === "registry:font" ? item.font : undefined
      if (item.type === "registry:font" && !font) {
        skipped.fontWithoutMetadata++
        continue
      }

      items.push({
        name: item.name,
        namespaced: `${handle}/${item.name}`,
        type,
        description: (item.description || "").slice(0, DESCRIPTION_MAX),
        categories: item.categories || [],
        registryName: entry.name,
        handle,
        ...(font ? { font } : {}),
      })
    }
  }

  console.log(
    `[catalog] Built ${items.length} items from ${Object.keys(registries).length} registries ` +
      `(skipped ${skipped.unavailable} refused by their origin, ${skipped.internal} internal, ${skipped.fontWithoutMetadata} fonts without metadata)`
  )

  return { generatedAt: new Date().toISOString(), registries, items }
}

// The files this is assembled from are baked into the deployment, so within
// one process the answer can never change. Caching the promise — not the
// result — also collapses concurrent first requests into a single read of the
// 68 views instead of one per caller.
let inFlight: Promise<Catalog | null> | null = null

export async function loadCatalog(): Promise<Catalog | null> {
  if (inFlight) return inFlight

  inFlight = buildCatalog().catch((error) => {
    console.error("[catalog] Build failed:", error)
    // Not retained: a failed read should not poison the process for good.
    inFlight = null
    return null
  })

  return inFlight
}


