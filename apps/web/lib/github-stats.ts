import type { DirectoryEntry, GitHubStats } from "./types";
import { loadGitHubData } from "./registry-data";

// Stars and last-push dates for every registry with a github_url.
//
// Read from data/github.json, refreshed by `pnpm index`. This module
// used to call the GitHub API during the build and write the result back to
// the github.json blob — which meant any build, and even a local dev render,
// overwrote production's cache. Nothing here writes anything any more.
//
// The stored shape keeps `fetchedAt` for provenance; callers never see it.

/**
 * GitHub stats for all registries that have a github_url, keyed by that URL.
 * Registries absent from data/github.json are simply omitted — the cards that
 * consume this already degrade to no stars badge.
 */
export async function fetchAllGitHubStats(
  registries: DirectoryEntry[]
): Promise<Record<string, Omit<GitHubStats, "fetchedAt">>> {
  const data = await loadGitHubData();

  const statsRecord: Record<string, Omit<GitHubStats, "fetchedAt">> = {};
  for (const registry of registries) {
    const entry = registry.github_url ? data[registry.github_url] : undefined;
    if (!entry) continue;
    statsRecord[registry.github_url!] = {
      stars: entry.stars,
      lastCommit: entry.lastCommit,
    };
  }

  return statsRecord;
}

/**
 * GitHub stats for a single registry URL. Returns null when the registry has
 * no record — for example a registry admitted after the last `pnpm index`.
 */
export async function fetchGitHubStatsForUrl(
  githubUrl: string
): Promise<Omit<GitHubStats, "fetchedAt"> | null> {
  const data = await loadGitHubData();
  const entry = data[githubUrl];
  if (!entry) return null;
  return { stars: entry.stars, lastCommit: entry.lastCommit };
}
