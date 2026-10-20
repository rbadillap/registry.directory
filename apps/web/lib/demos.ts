import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "./types"
import { loadManifest } from "./registry-data"

// data/demos.json: for each registry, the page on its author's own site where
// an item can be seen working. Written weekly by `pnpm index` from the
// author's sitemap.xml (scripts/steps/demos.mjs); read here and nowhere else.

interface DemosRecord {
  status: "ok" | "reused" | "missing" | "skipped"
  /** The host the homepage's sitemap.xml redirected to, when it moved. */
  redirectedTo?: string
  demos: Record<string, string>
  /** Items whose link lands on the page of their numbered group. */
  groups?: string[]
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
 * only other host allowed is the one that homepage redirected to.
 */
export async function loadDemosFor(
  entry: DirectoryEntry
): Promise<Record<string, string>> {
  const [file, manifest] = await Promise.all([loadDemosFile(), loadManifest()])
  const key = manifest?.registries.find((r) => r.name === entry.name)?.key
  const record = key ? file?.registries[key] : undefined
  if (!record?.demos) return {}

  const hosts = new Set([host(entry.url), record.redirectedTo].filter(Boolean))
  const trusted: Record<string, string> = {}
  for (const [name, url] of Object.entries(record.demos)) {
    if (!/^https?:\/\//.test(url)) continue
    if (!hosts.has(host(url))) continue
    trusted[name] = url
  }
  return trusted
}

/** Where a group link lands: the group's page, and how many variants it shows. */
export interface DemoGroup {
  label: string
  count: number
}

/**
 * A registry's group links, keyed by item name: items such as accordion-01
 * whose link opens the page that shows the whole numbered set. The label is
 * the page's own last segment, as a reader would name it; the count is how
 * many of the registry's items land on that same page.
 */
export async function loadDemoGroupsFor(
  entry: DirectoryEntry
): Promise<Record<string, DemoGroup>> {
  const [file, manifest, demos] = await Promise.all([
    loadDemosFile(),
    loadManifest(),
    loadDemosFor(entry),
  ])
  const key = manifest?.registries.find((r) => r.name === entry.name)?.key
  const grouped = (key ? file?.registries[key]?.groups : undefined) ?? []

  const perPage = new Map<string, number>()
  for (const name of grouped) {
    const url = demos[name]
    if (url) perPage.set(url, (perPage.get(url) ?? 0) + 1)
  }

  const groups: Record<string, DemoGroup> = {}
  for (const name of grouped) {
    const url = demos[name]
    if (!url) continue
    const segment = new URL(url).pathname.replace(/\/+$/, "").split("/").pop() ?? ""
    const words = decodeURIComponent(segment).replace(/[-_]+/g, " ").trim()
    groups[name] = {
      label: words.charAt(0).toUpperCase() + words.slice(1),
      count: perPage.get(url) ?? 1,
    }
  }
  return groups
}
