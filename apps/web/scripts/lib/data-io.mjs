// Shared plumbing for the local indexer (scripts/index.mjs and its steps).
//
// BAD-138: the site reads one source of truth — the JSON committed under
// apps/web/data. Everything that reaches out to a third-party registry lives
// in this folder and runs on the maintainer's machine, where a patient retry
// against a 429 costs nothing. Vercel never fetches a registry index.

import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Every script is meant to be run from apps/web (`pnpm index`), but resolving
// against this file keeps it correct from any cwd.
export const WEB_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DATA_DIR = join(WEB_DIR, "data");
export const REGISTRIES_DIR = join(DATA_DIR, "registries");

// Same identity the app presented when it still fetched indexes itself.
export const USER_AGENT =
  "Mozilla/5.0 (compatible; registry-directory/1.0; +https://registry.directory)";

export const CONCURRENCY = 6;
const ATTEMPTS = 5;
const FETCH_TIMEOUT_MS = 20_000;

/** Directory entries, straight from the file the app also reads. */
export async function loadDirectory() {
  const raw = await readFile(join(WEB_DIR, "public/directory.json"), "utf8");
  return JSON.parse(raw).registries;
}

/**
 * Stable filename for a registry's view. Namespace wins over the GitHub owner
 * so the on-disk key matches the public handle; entries with neither fall back
 * to a slug of their directory name. The app never recomputes this — it reads
 * the mapping from data/manifest.json, so the two can not drift.
 */
export function registryKey(entry) {
  if (entry.namespace) return entry.namespace.replace(/^@/, "").toLowerCase();
  const gh = parseGithubRef(entry.github_url);
  if (gh) return gh.owner.toLowerCase();
  return entry.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseGithubRef(githubUrl) {
  if (!githubUrl) return null;
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match?.[1] || !match[2]) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

/** Mirrors getRegistryJsonUrl in lib/fetch-utils.ts. */
export function indexUrl(entry) {
  if (entry.registry_url) return entry.registry_url;
  return `${entry.url.replace(/\/$/, "")}/r/registry.json`;
}

/** Mirrors itemBaseUrl in lib/catalog.ts: where `${base}/{name}.json` lives. */
export function itemBaseUrl(entry) {
  if (entry.registry_url) return entry.registry_url.replace(/\/[^/]+\.json$/, "");
  return `${entry.url.replace(/\/$/, "")}/r`;
}

/**
 * Patient fetch. 429 gets a long, growing breather because a rate limit is a
 * request to wait, not a failure; anything else gets a short one.
 */
export async function fetchWithRetries(url, { attempts = ATTEMPTS } = {}) {
  let lastError = "unknown";
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "user-agent": USER_AGENT },
        redirect: "follow",
      });
      if (res.ok) return { json: await res.json() };
      lastError = `HTTP ${res.status}`;
      const wait = res.status === 429 ? 15_000 * attempt : 2_000 * attempt;
      if (attempt < attempts) await sleep(wait);
    } catch (error) {
      lastError = error?.message?.slice(0, 80) ?? "fetch failed";
      if (attempt < attempts) await sleep(2_000 * attempt);
    }
  }
  return { error: `${lastError} (after ${attempts} attempts)` };
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Run `task` over `items` with a fixed number of workers, preserving order. */
export async function mapPool(items, task, concurrency = CONCURRENCY) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await task(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function readJsonFile(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Writes formatted JSON, and only when the bytes actually changed. An
 * unchanged registry must produce an unchanged file: git diffs stay readable,
 * and a rebuild over identical data can not churn ISR.
 *
 * Formatted rather than minified on purpose. It costs ~40% more bytes on
 * disk, but compresses away to almost nothing in git, and the whole point of
 * committing this data is being able to read what changed in a diff.
 *
 * Write-then-rename because the site reads these files: a build running
 * against a half-written view is exactly the kind of lie the guard exists to
 * catch, and rename is atomic.
 */
export async function writeJsonFile(path, value) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  const existing = await readFile(path, "utf8").catch(() => null);
  if (existing === body) return false;
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, body, "utf8");
  await rename(tmp, path);
  return true;
}

export async function listRegistryFiles() {
  try {
    const names = await readdir(REGISTRIES_DIR);
    return names.filter((n) => n.endsWith(".json")).sort();
  } catch {
    return [];
  }
}

export function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
