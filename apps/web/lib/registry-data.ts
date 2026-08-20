import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "./types"
import type { RegistryItem } from "./registry-types"

// The one source of truth. Everything the site renders about a
// registry's catalog comes from files committed under apps/web/data, produced
// by `pnpm index`, run locally. No page, route or build step
// reaches out to a third-party registry for an index any more.
//
// The mapping from a directory entry to its view file lives in the manifest,
// not in a key function duplicated here — the indexer writes the mapping it
// used, so the two halves can not drift apart.

const DATA_DIR = join(process.cwd(), "data")

export interface ManifestRegistry {
  /** Filename stem under data/registries. */
  key: string
  /** DirectoryEntry.name — the join key back to public/directory.json. */
  name: string
  /** The index URL the view was built from, kept for provenance. */
  url: string
  items: number
  /** "missing" = the indexer could not reach this origin and no view exists. */
  status: "ok" | "reused" | "missing"
  /** False when every sampled item was definitively gated at the origin. */
  resolvable: boolean
  /** The origin inlines file content in its index. */
  originEmbedsContent?: boolean
  /** Why this view is a carry-forward rather than a fresh read. */
  error?: string
}

export interface Manifest {
  generatedAt: string
  date: string
  counts: {
    directory: number
    views: number
    ok: number
    reused: number
    missing: number
    items: number
    github: number
    collections: number
  }
  registries: ManifestRegistry[]
}

export interface RegistryView {
  key: string
  /** DirectoryEntry.name. */
  entry: string
  /** The registry's own name, as its index declares it. */
  name: string
  homepage: string
  indexUrl: string
  /** Where individual item JSONs live: `${itemBase}/{name}.json`. */
  itemBase: string
  resolvable: boolean
  /** The origin inlines file content in its index; the view strips it. */
  embedsContent?: boolean
  items: RegistryItem[]
}

// The manifest is ~75 short records and every render path needs it, so it is
// read once per process. Views are not cached: the largest is several MB and
// holding all of them would cost more memory than the disk reads save.
let manifestPromise: Promise<Manifest | null> | null = null

async function readManifest(): Promise<Manifest | null> {
  try {
    const raw = await readFile(join(DATA_DIR, "manifest.json"), "utf8")
    return JSON.parse(raw) as Manifest
  } catch {
    console.error(
      "[data] data/manifest.json is unreadable — run `pnpm index` from apps/web"
    )
    return null
  }
}

export function loadManifest(): Promise<Manifest | null> {
  manifestPromise ??= readManifest()
  return manifestPromise
}

export async function loadRegistryView(
  entry: DirectoryEntry
): Promise<RegistryView | null> {
  const manifest = await loadManifest()
  const record = manifest?.registries.find((r) => r.name === entry.name)
  if (!record) {
    console.error(
      `[data] "${entry.name}" has no view in data/ — run \`pnpm index\` from apps/web`
    )
    return null
  }

  // A recorded gap, not a surprise: the indexer could not reach this origin
  // and said so. Callers already degrade gracefully on null.
  if (record.status === "missing") return null

  try {
    const raw = await readFile(
      join(DATA_DIR, "registries", `${record.key}.json`),
      "utf8"
    )
    return JSON.parse(raw) as RegistryView
  } catch {
    console.error(`[data] data/registries/${record.key}.json is unreadable`)
    return null
  }
}

export interface GitHubStatsEntry {
  stars: number
  lastCommit: string
  fetchedAt: string
}

let githubPromise: Promise<Record<string, GitHubStatsEntry>> | null = null

/** data/github.json: stars and last-push date, keyed by github_url. */
export function loadGitHubData(): Promise<Record<string, GitHubStatsEntry>> {
  githubPromise ??= readFile(join(DATA_DIR, "github.json"), "utf8")
    .then((raw) => JSON.parse(raw) as Record<string, GitHubStatsEntry>)
    .catch(() => {
      console.log("[github-stats] data/github.json unavailable — stats omitted")
      return {}
    })
  return githubPromise
}
