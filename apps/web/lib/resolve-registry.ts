import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "./types"
import type { Registry } from "./registry-types"
import { loadRegistryView } from "./registry-data"

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

/**
 * A registry's index, read from the view committed at
 * data/registries/{key}.json. This used to fetch the registry's live
 * registry.json on every render — up to 3.4 MB per index, re-downloaded by
 * every page that needed it, which is what made ISR writes the largest line
 * on the Vercel bill.
 *
 * The network work — retries, pagination, rate limits — now happens once, in
 * scripts/index.mjs, run locally. Here it is a file read.
 *
 * Returns null when the entry has no view — either because its origin was
 * unreachable at index time (the manifest records that as status "missing")
 * or because directory.json gained an entry that `pnpm index` has not seen
 * yet (which scripts/views-check.mjs refuses to build against). Callers
 * already degrade: the landing renders without a catalog, the item index
 * skips the registry.
 */
export async function loadRegistryIndex(
  entry: DirectoryEntry
): Promise<Registry | null> {
  const view = await loadRegistryView(entry)
  if (!view) return null

  return {
    name: view.name,
    homepage: view.homepage,
    items: view.items,
  }
}
