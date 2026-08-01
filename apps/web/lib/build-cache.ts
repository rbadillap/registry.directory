import { createHash } from "node:crypto"
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises"
import { join } from "node:path"

// Registry indexes over 2MB bypass Next's data cache ("items over 2MB can not
// be cached"), so during static generation every page of a large registry
// re-downloads its index — 600+ round trips per build for a single registry.
// This file cache shares one download per index across all build workers.
// Active only while building; dev and production serving never use it.
//
// Lives under .next/cache (not tmpdir: turbo's strict env mode strips TMPDIR,
// splitting the cache across launchers). Vercel persists .next/cache between
// builds, so production builds warm-start too; the TTL keeps daily data fresh.

const CACHE_DIR = join(process.cwd(), ".next", "cache", "registry-index")
const MAX_AGE_MS = 60 * 60 * 1000

export function isBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export"
  )
}

function cachePath(url: string): string {
  const hash = createHash("sha1").update(url).digest("hex")
  return join(CACHE_DIR, `${hash}.json`)
}

export async function readCachedJson<T>(url: string): Promise<T | null> {
  if (!isBuildPhase()) return null

  try {
    const path = cachePath(url)
    const info = await stat(path)
    if (Date.now() - info.mtimeMs > MAX_AGE_MS) return null
    return JSON.parse(await readFile(path, "utf8")) as T
  } catch {
    return null
  }
}

export async function writeCachedJson(
  url: string,
  data: unknown
): Promise<void> {
  if (!isBuildPhase()) return

  try {
    await mkdir(CACHE_DIR, { recursive: true })
    const path = cachePath(url)
    // Write-then-rename keeps concurrent workers from reading partial files
    const tmp = `${path}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(data), "utf8")
    await rename(tmp, path)
  } catch {
    // Best-effort: the network path still works without the cache
  }
}
