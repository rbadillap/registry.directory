import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "./types"
import { loadManifest } from "./registry-data"

// data/demos.json: for each registry, the page on its author's own site where
// an item can be seen working. Written weekly by `pnpm index` from the
// author's sitemap.xml (scripts/steps/demos.mjs); read here and nowhere else.

interface DemosRecord {
  status: "ok" | "reused" | "missing" | "skipped"
  /** Hosts beyond the homepage's that its own sitemap.xml named, by
   *  redirecting to them or by listing their sitemaps in its index. */
  ownHosts?: string[]
  demos: Record<string, string>
}

interface DemosFile {
  generatedAt: string
  registries: Record<string, DemosRecord>
}

const DATA_DIR = join(process.cwd(), "data")

let demosPromise: Promise<DemosFile | null> | null = null

function loadDemosFile(): Promise<DemosFile | null> {
  demosPromise ??= readFile(join(DATA_DIR, "demos.json"), "utf8")
    .then((raw) => JSON.parse(raw) as DemosFile)
    .catch(() => null)
  return demosPromise
}

function host(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return null
  }
}

/**
 * A registry's demo links, keyed by item name.
 *
 * The indexer already kept only links on the registry's own hosts; the check
 * is repeated here because this is the last step before a link leaves the
 * site. The homepage it is checked against is the one in the directory; the
 * only other hosts allowed are the ones that homepage's own sitemap named.
 */
export async function loadDemosFor(
  entry: DirectoryEntry
): Promise<Record<string, string>> {
  const [file, manifest] = await Promise.all([loadDemosFile(), loadManifest()])
  const key = manifest?.registries.find((r) => r.name === entry.name)?.key
  const record = key ? file?.registries[key] : undefined
  if (!record?.demos) return {}

  const hosts = new Set([host(entry.url), ...(record.ownHosts ?? [])].filter(Boolean))
  const trusted: Record<string, string> = {}
  for (const [name, url] of Object.entries(record.demos)) {
    if (!/^https?:\/\//.test(url)) continue
    if (!hosts.has(host(url))) continue
    trusted[name] = url
  }
  return trusted
}
