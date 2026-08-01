import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "./types"
import type { Registry } from "./registry-types"
import { registryFetch, getRegistryJsonUrl } from "./fetch-utils"

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

export async function fetchRegistryIndex(
  entry: DirectoryEntry,
  timeout = 5000
): Promise<Registry | null> {
  const targetUrl = getRegistryJsonUrl(entry)
  if (!targetUrl) return null

  try {
    const response = await registryFetch(targetUrl, {
      timeout,
      next: { revalidate: 86400 },
    })
    if (!response.ok) return null
    return (await response.json()) as Registry
  } catch (error) {
    console.error(`[Registry] Index fetch error for ${entry.name}:`, error)
    return null
  }
}
