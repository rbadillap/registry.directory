import type { DirectoryEntry } from "./types"

// Where a registry lives on this site. Pure on purpose: client components
// import it too, so nothing here may touch the filesystem.

export type GithubRef = { owner: string; repo: string }

export function parseGithubRef(githubUrl?: string): GithubRef | null {
  if (!githubUrl) return null
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match?.[1] || !match[2]) return null
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") }
}

// Same slug as registryKey() in scripts/lib/data-io.mjs, so the handle of an
// entry with neither namespace nor repo equals the key of its view.
function nameSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// "@efferd" → "efferd". An entry with no namespace and no repo falls back to
// a slug of its name: a namespace is a claim about the official shadcn index,
// a route is only our address, and a registry must not need the first to get
// the second. Null for github-backed entries without a namespace — they live
// at /{owner}/{repo} and get no alias.
export function entryHandle(entry: DirectoryEntry): string | null {
  if (entry.namespace) return entry.namespace.replace(/^@/, "")
  if (parseGithubRef(entry.github_url)) return null
  return nameSlug(entry.name) || null
}

// Canonical route prefix for an entry: github pair wins, handle otherwise.
export function registryBasePath(entry: DirectoryEntry): string | null {
  const gh = parseGithubRef(entry.github_url)
  if (gh) return `/${gh.owner}/${gh.repo}`
  const handle = entryHandle(entry)
  if (handle) return `/${handle}`
  return null
}
