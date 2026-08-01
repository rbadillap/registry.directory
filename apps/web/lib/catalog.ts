import { put } from "@vercel/blob"
import type { DirectoryEntry } from "./types"
import type { RegistryItem } from "./registry-types"
import { registryFetch } from "./fetch-utils"
import { isBuildPhase } from "./build-cache"
import {
  loadDirectory,
  parseGithubRef,
  entryHandle,
  fetchRegistryIndex,
} from "./resolve-registry"

// Aggregated cross-registry catalog served at /r/registry.json (shadcn
// dynamic search protocol) and backing the /r/{handle}/{item}.json proxy.
//
// Built once per daily build from the home page (blob write, same pattern
// as github.json) and read at request time by the /r route handler.
//
// Fallback chain, mirroring github-stats.ts:
// 1. Build with BLOB_READ_WRITE_TOKEN → catalog persisted to blob
// 2. Runtime with blob → fetch once per instance, cache in memory (1h)
// 3. Runtime without blob (local dev) → build in-process on first request

const BLOB_FILENAME = "catalog.json"
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

function itemBaseUrl(entry: DirectoryEntry): string {
  if (entry.registry_url) {
    return entry.registry_url.replace(/\/[^/]+\.json$/, "")
  }
  return `${entry.url.replace(/\/$/, "")}/r`
}

function catalogHandle(entry: DirectoryEntry): string | null {
  const handle = entryHandle(entry)
  if (handle) return handle.toLowerCase()
  const gh = parseGithubRef(entry.github_url)
  return gh ? gh.owner.toLowerCase() : null
}

// A registry whose sampled items all fail to resolve is fully gated (or
// broken) — listing it would turn every install into our 502. Sampling
// first/middle/last keeps partially-gated registries in.
//
// Exclusion requires DEFINITIVE gating (401/402/403/404/410) on every
// sample. Transient failures — 429 rate limits, 5xx, timeouts — get the
// benefit of the doubt: a registry throttling our build burst must not
// drop out of the catalog (Cult UI, 31-jul-2026).
const GATED_STATUSES = new Set([401, 402, 403, 404, 410])

async function originResolves(
  base: string,
  names: string[]
): Promise<boolean> {
  const samples = Array.from(
    new Set(
      [names[0], names[Math.floor(names.length / 2)], names[names.length - 1]].filter(
        (n): n is string => Boolean(n)
      )
    )
  )

  const results = await Promise.allSettled(
    samples.map(async (name) => {
      const res = await registryFetch(`${base}/${name}.json`, {
        timeout: 5000,
        cache: "no-store",
      })
      await res.body?.cancel()
      return res.status
    })
  )

  let allGated = results.length > 0
  for (const result of results) {
    if (
      result.status === "fulfilled" &&
      result.value >= 200 &&
      result.value < 300
    ) {
      return true
    }
    const gated =
      result.status === "fulfilled" && GATED_STATUSES.has(result.value)
    if (!gated) allGated = false
  }
  return !allGated
}

export async function buildCatalog(options?: {
  probeOrigins?: boolean
}): Promise<Catalog> {
  const probeOrigins = options?.probeOrigins ?? true
  const entries = await loadDirectory()

  const registries: Record<string, CatalogRegistry> = {}
  const items: CatalogItem[] = []

  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      const handle = catalogHandle(entry)
      if (!handle) return null

      const index = await fetchRegistryIndex(entry, 10000)
      if (!index?.items?.length) return null

      const base = itemBaseUrl(entry)
      const names = index.items.map((i) => i.name)

      if (probeOrigins && !(await originResolves(base, names))) {
        console.log(
          `[catalog] Excluding ${entry.name}: sampled items do not resolve at ${base}`
        )
        return null
      }

      const seen = new Set<string>()
      const registryItems: CatalogItem[] = []
      for (const item of index.items as RegistryItem[]) {
        if (seen.has(item.name)) continue
        seen.add(item.name)
        registryItems.push({
          name: item.name,
          namespaced: `${handle}/${item.name}`,
          type: item.type || "registry:item",
          description: (item.description || "").slice(0, DESCRIPTION_MAX),
          categories: item.categories || [],
          registryName: entry.name,
          handle,
        })
      }

      return { handle, registry: { name: entry.name, itemBase: base }, registryItems }
    })
  )

  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value) continue
    const { handle, registry, registryItems } = result.value
    if (registries[handle]) {
      console.log(`[catalog] Duplicate handle ${handle}, keeping first`)
      continue
    }
    registries[handle] = registry
    items.push(...registryItems)
  }

  console.log(
    `[catalog] Built ${items.length} items from ${Object.keys(registries).length} registries`
  )

  return { generatedAt: new Date().toISOString(), registries, items }
}

export async function persistCatalog(catalog: Catalog): Promise<void> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) return

  try {
    await put(BLOB_FILENAME, JSON.stringify(catalog), {
      access: "public",
      token: blobToken,
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    console.log(`[catalog] Wrote catalog to blob (${catalog.items.length} items)`)
  } catch (error) {
    console.error("[catalog] Failed to write blob:", error)
  }
}

// Called from the home page's build render (same trigger as github.json).
// No-ops outside the build phase so dev renders stay cheap, and without a
// blob token so forks degrade gracefully.
export async function buildAndPersistCatalog(): Promise<void> {
  if (!isBuildPhase()) return
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("[catalog] No BLOB_READ_WRITE_TOKEN, skipping catalog persist")
    return
  }

  try {
    const catalog = await buildCatalog()
    if (catalog.items.length > 0) {
      await persistCatalog(catalog)
    }
  } catch (error) {
    console.error("[catalog] Build-time persist failed:", error)
  }
}

async function readCatalogBlob(): Promise<Catalog | null> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) return null

  try {
    const storeMatch = blobToken.match(/vercel_blob_rw_([^_]+)_/)
    if (!storeMatch) return null

    const blobUrl = `https://${storeMatch[1]}.public.blob.vercel-storage.com/${BLOB_FILENAME}`
    // The catalog is several MB — over Next's data-cache limit — so skip
    // the data cache explicitly; the in-memory cache below absorbs the cost.
    const response = await fetch(blobUrl, { cache: "no-store" })
    if (!response.ok) return null

    return (await response.json()) as Catalog
  } catch {
    return null
  }
}

let memory: { catalog: Catalog; at: number } | null = null

export async function loadCatalog(): Promise<Catalog | null> {
  if (memory && Date.now() - memory.at < MEMORY_TTL_MS) {
    return memory.catalog
  }

  let catalog = await readCatalogBlob()

  if (!catalog) {
    // Local dev without blob: build in-process (skip origin probes — they
    // are a build-time quality gate, not worth 200 requests per dev reload).
    console.log("[catalog] No blob available, building catalog in-process")
    try {
      catalog = await buildCatalog({ probeOrigins: false })
    } catch (error) {
      console.error("[catalog] In-process build failed:", error)
      return memory?.catalog ?? null
    }
  }

  if (!catalog.items.length) return memory?.catalog ?? null

  memory = { catalog, at: Date.now() }
  return catalog
}
