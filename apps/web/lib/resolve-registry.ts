import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "./types"
import type { Registry } from "./registry-types"
import { loadRegistryView } from "./registry-data"

import { entryHandle, parseGithubRef } from "./registry-path"

// The route rules live in registry-path.ts (pure, client-safe); re-exported
// so server callers keep one import.
export {
  entryHandle,
  parseGithubRef,
  registryBasePath,
  type GithubRef,
} from "./registry-path"

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
 * data/registries/{key}.json.
 *
 * A file read, never a request: an index can reach 3.4 MB, and fetching one
 * per render is what makes a page expensive to regenerate. All the network
 * work — retries, pagination, rate limits — happens once in scripts/index.mjs,
 * run locally.
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
