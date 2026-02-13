import { put } from "@vercel/blob";
import type { DirectoryEntry, GitHubStats } from "./types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BLOB_FILENAME = "github.json";

type GitHubCache = Record<string, GitHubStats>;

/**
 * Extract owner/repo from a GitHub URL.
 * e.g. "https://github.com/shadcn-ui/ui" → { owner: "shadcn-ui", repo: "ui" }
 */
function parseGitHubUrl(
  githubUrl: string
): { owner: string; repo: string } | null {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match?.[1] || !match[2]) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

/**
 * Read the cached github.json from Vercel Blob (public URL, no token needed).
 * Returns empty object if blob is unavailable or malformed.
 */
async function readBlobCache(): Promise<GitHubCache> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return {};

  try {
    // Derive the public blob URL from the token's store ID
    // Vercel Blob public URLs follow: https://<store-id>.public.blob.vercel-storage.com/<filename>
    const storeMatch = blobToken.match(/vercel_blob_rw_([^_]+)_/);
    if (!storeMatch) return {};

    const storeId = storeMatch[1];
    const blobUrl = `https://${storeId}.public.blob.vercel-storage.com/${BLOB_FILENAME}`;

    const response = await fetch(blobUrl, { cache: "no-store" });
    if (!response.ok) return {};

    const data = (await response.json()) as GitHubCache;
    return data;
  } catch {
    console.log("[github-stats] Could not read blob cache, starting fresh");
    return {};
  }
}

/**
 * Write updated cache to Vercel Blob. Requires BLOB_READ_WRITE_TOKEN.
 */
async function writeBlobCache(cache: GitHubCache): Promise<void> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return;

  try {
    await put(BLOB_FILENAME, JSON.stringify(cache), {
      access: "public",
      token: blobToken,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    console.log(
      `[github-stats] Wrote cache to blob (${Object.keys(cache).length} entries)`
    );
  } catch (error) {
    console.error("[github-stats] Failed to write blob cache:", error);
  }
}

/**
 * Fetch GitHub stats for a single repo via the GitHub REST API.
 */
async function fetchGitHubRepo(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubStats | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "registry-directory/1.0",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        `[github-stats] GitHub API ${response.status} for ${owner}/${repo}`
      );
      return null;
    }

    const data = (await response.json()) as {
      stargazers_count: number;
      pushed_at: string;
    };

    return {
      stars: data.stargazers_count,
      lastCommit: data.pushed_at,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      `[github-stats] Failed to fetch ${owner}/${repo}:`,
      error
    );
    return null;
  }
}

/**
 * Check if a cache entry is still fresh (within TTL).
 */
function isFresh(entry: GitHubStats): boolean {
  const fetchedAt = new Date(entry.fetchedAt).getTime();
  return Date.now() - fetchedAt < CACHE_TTL_MS;
}

/**
 * Fetch GitHub stats for all registries that have a github_url.
 *
 * Fallback chain:
 * 1. No GITHUB_TOKEN → return {}, no fetches at all
 * 2. GITHUB_TOKEN but no BLOB_READ_WRITE_TOKEN → fetch stats, no cache persistence
 * 3. Both tokens → full cache flow (read blob → fetch stale → write blob)
 *
 * The returned record omits `fetchedAt` — that's internal to the cache.
 */
export async function fetchAllGitHubStats(
  registries: DirectoryEntry[]
): Promise<Record<string, Omit<GitHubStats, "fetchedAt">>> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.log("[github-stats] No GITHUB_TOKEN, skipping GitHub stats");
    return {};
  }

  // Read existing cache from blob
  const cache = await readBlobCache();

  let cacheHits = 0;
  let cacheMisses = 0;

  // Fetch stats for registries with github_url, respecting cache
  const results = await Promise.allSettled(
    registries
      .filter((r) => r.github_url)
      .map(async (registry) => {
        const parsed = parseGitHubUrl(registry.github_url!);
        if (!parsed) return null;

        const cacheKey = registry.github_url!;

        // Check cache freshness
        if (cache[cacheKey] && isFresh(cache[cacheKey])) {
          cacheHits++;
          return { url: registry.github_url!, stats: cache[cacheKey] };
        }

        cacheMisses++;
        const stats = await fetchGitHubRepo(
          parsed.owner,
          parsed.repo,
          githubToken
        );
        if (stats) {
          cache[cacheKey] = stats; // Update cache with fresh data
        }
        return stats ? { url: registry.github_url!, stats } : null;
      })
  );

  console.log(
    `[github-stats] Cache hits: ${cacheHits}, misses: ${cacheMisses}`
  );

  // Write updated cache back to blob
  await writeBlobCache(cache);

  // Build the public-facing record (keyed by github_url, without fetchedAt)
  const statsRecord: Record<string, Omit<GitHubStats, "fetchedAt">> = {};
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      const { fetchedAt: _, ...publicStats } = result.value.stats;
      statsRecord[result.value.url] = publicStats;
    }
  }

  return statsRecord;
}

/**
 * Fetch GitHub stats for a single registry URL.
 * Reads blob cache using ISR-compatible fetch (revalidate, not no-store)
 * so it works during static generation without triggering DYNAMIC_SERVER_USAGE.
 * Returns null if blob cache is unavailable or entry not found.
 */
export async function fetchGitHubStatsForUrl(
  githubUrl: string
): Promise<Omit<GitHubStats, "fetchedAt"> | null> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return null;

  try {
    const storeMatch = blobToken.match(/vercel_blob_rw_([^_]+)_/);
    if (!storeMatch) return null;

    const storeId = storeMatch[1];
    const blobUrl = `https://${storeId}.public.blob.vercel-storage.com/${BLOB_FILENAME}`;

    // Use revalidate instead of no-store to be compatible with static generation
    const response = await fetch(blobUrl, { next: { revalidate: 86400 } });
    if (!response.ok) return null;

    const cache = (await response.json()) as GitHubCache;
    if (!cache[githubUrl]) return null;

    const { fetchedAt: _, ...publicStats } = cache[githubUrl];
    return publicStats;
  } catch {
    return null;
  }
}
