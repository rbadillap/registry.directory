import type { DirectoryEntry } from "./types"
import { entryHandle, parseGithubRef } from "./registry-path.ts"

// Every first path segment a registry in the directory answers to: its
// handle (/{handle}) and its GitHub owner (/{owner}/{repo}). Until the
// cut-over from the current /r, a team handle can't be one of these, or the
// team would hide that registry's page and its proxy.
export function directoryKeys(entries: readonly DirectoryEntry[]): Set<string> {
  const keys = new Set<string>()
  for (const entry of entries) {
    const handle = entryHandle(entry)
    if (handle) keys.add(handle.toLowerCase())
    const gh = parseGithubRef(entry.github_url)
    if (gh) keys.add(gh.owner.toLowerCase())
  }
  return keys
}
