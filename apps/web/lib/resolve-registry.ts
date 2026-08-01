import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "./types"
import type { Registry } from "./registry-types"
import { registryFetch, getRegistryJsonUrl } from "./fetch-utils"
import { readCachedJson, writeCachedJson } from "./build-cache"

export type GithubRef = { owner: string; repo: string }

export function parseGithubRef(githubUrl?: string): GithubRef | null {
  if (!githubUrl) return null
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match?.[1] || !match[2]) return null
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") }
}

// "@efferd" → "efferd"; null when the entry has no namespace.
export function entryHandle(entry: DirectoryEntry): string | null {
  if (!entry.namespace) return null
  return entry.namespace.replace(/^@/, "")
}

// Canonical route prefix for an entry: github pair wins, handle is the
// fallback for namespaced entries without a repo, null when neither exists.
export function registryBasePath(entry: DirectoryEntry): string | null {
  const gh = parseGithubRef(entry.github_url)
  if (gh) return `/${gh.owner}/${gh.repo}`
  const handle = entryHandle(entry)
  if (handle) return `/${handle}`
  return null
}

export async function loadDirectory(): Promise<DirectoryEntry[]> {
  const filePath = join(process.cwd(), "public/directory.json")
  const fileContents = await readFile(filePath, "utf8")
  const data = JSON.parse(fileContents) as { registries: DirectoryEntry[] }
  return data.registries
}

export async function resolveByGithub(
  owner: string,
  repo: string
): Promise<DirectoryEntry | null> {
  const registries = await loadDirectory()
  return (
    registries.find((r) => {
      const gh = parseGithubRef(r.github_url)
      return gh?.owner === owner && gh.repo === repo
    }) ?? null
  )
}

// May return a github-backed entry — the caller decides whether to redirect
// to its canonical /{owner}/{repo} route.
export async function resolveByHandle(
  handle: string
): Promise<DirectoryEntry | null> {
  const normalized = handle.toLowerCase()
  const registries = await loadDirectory()
  return (
    registries.find((r) => entryHandle(r)?.toLowerCase() === normalized) ?? null
  )
}

// shadcn dynamic search (jul 2026): a registry may answer the bare GET with
// a partial page plus a pagination object. Without this loop we would
// silently index 50 items instead of the full catalog.
type PaginatedRegistry = Registry & {
  pagination?: { total: number; offset: number; limit: number; hasMore: boolean }
}

const MAX_PAGINATION_PAGES = 100

async function fetchRemainingPages(
  targetUrl: string,
  first: PaginatedRegistry,
  timeout: number
): Promise<Registry> {
  const items = [...first.items]
  const pageSize = first.pagination?.limit || items.length || 100

  for (let page = 0; page < MAX_PAGINATION_PAGES; page++) {
    const url = new URL(targetUrl)
    url.searchParams.set("limit", String(pageSize))
    url.searchParams.set("offset", String(items.length))

    const response = await registryFetch(url.toString(), {
      timeout,
      next: { revalidate: 86400 },
    })
    if (!response.ok) break

    const next = (await response.json()) as PaginatedRegistry
    if (!next.items?.length) break
    items.push(...next.items)
    if (!next.pagination?.hasMore) break
  }

  return { ...first, items }
}

export async function fetchRegistryIndex(
  entry: DirectoryEntry,
  timeout = 5000
): Promise<Registry | null> {
  const targetUrl = getRegistryJsonUrl(entry)
  if (!targetUrl) return null

  const cached = await readCachedJson<Registry>(targetUrl)
  if (cached) return cached

  try {
    const response = await registryFetch(targetUrl, {
      timeout,
      next: { revalidate: 86400 },
    })
    if (!response.ok) return null
    let data = (await response.json()) as PaginatedRegistry
    if (data.pagination?.hasMore) {
      console.log(
        `[Registry] ${entry.name} paginates its index (${data.items.length}/${data.pagination.total}), fetching remaining pages`
      )
      data = await fetchRemainingPages(targetUrl, data, timeout)
    }
    await writeCachedJson(targetUrl, data)
    return data
  } catch (error) {
    console.error(`[Registry] Index fetch error for ${entry.name}:`, error)
    return null
  }
}
