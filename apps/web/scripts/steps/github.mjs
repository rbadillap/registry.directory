// Step 2 of the indexer: refresh stars and last-push dates for every entry
// with a github_url, into data/github.json.
//
// Same shape as the github.json blob this replaces — Record<github_url,
// { stars, lastCommit, fetchedAt }> — so the reader in lib/github-stats.ts
// only changes where it reads from, not what it parses.
//
// Usage, standalone, from apps/web:
//   node --env-file=.env.local scripts/steps/github.mjs

import { join } from "node:path";
import {
  DATA_DIR,
  loadDirectory,
  mapPool,
  parseGithubRef,
  readJsonFile,
  writeJsonFile,
} from "../lib/data-io.mjs";

const GITHUB_PATH = join(DATA_DIR, "github.json");

async function fetchRepo(owner, repo, token) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "registry-directory/1.0",
    },
  });

  if (!response.ok) {
    return { error: `HTTP ${response.status}` };
  }

  const data = await response.json();
  return {
    stats: {
      stars: data.stargazers_count,
      lastCommit: data.pushed_at,
      fetchedAt: new Date().toISOString(),
    },
  };
}

export async function indexGithub() {
  const token = process.env.GITHUB_TOKEN;
  // Carry-forward base: a repo the API refuses today keeps yesterday's stars
  // rather than losing its badge.
  const previous = (await readJsonFile(GITHUB_PATH)) ?? {};

  if (!token) {
    console.log("github: GITHUB_TOKEN missing — kept the existing data/github.json");
    return { total: Object.keys(previous).length, refreshed: 0, failed: 0 };
  }

  const entries = (await loadDirectory()).filter((e) => e.github_url);
  const stats = { ...previous };
  let refreshed = 0;
  const failures = [];

  await mapPool(entries, async (entry) => {
    const gh = parseGithubRef(entry.github_url);
    if (!gh) return;

    const result = await fetchRepo(gh.owner, gh.repo, token);
    if (result.stats) {
      stats[entry.github_url] = result.stats;
      refreshed += 1;
      return;
    }

    failures.push(`${entry.name} (${result.error})`);
    if (!stats[entry.github_url]) return;
    console.log(`  ${entry.name}: ${result.error} — kept previous stats`);
  });

  await writeJsonFile(GITHUB_PATH, stats);

  console.log(
    `github: ${refreshed}/${entries.length} repos refreshed, ${Object.keys(stats).length} entries on file`
  );
  if (failures.length > 0) console.log(`github failures: ${failures.join(", ")}`);

  return { total: Object.keys(stats).length, refreshed, failed: failures.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await indexGithub();
}
