// Daily snapshot ingestion. Fetches every registry's index and persists the
// raw snapshot to Vercel Blob at snapshots/{YYYY-MM-DD}.json.
//
// Runs on the maintainer's machine, never in CI or Vercel compute — locally
// we can afford patient retries that a build never could. The snapshot
// history is never deleted: no one else on the internet archives registry
// indexes (the Wayback Machine holds zero captures of any registry.json),
// so the accumulated snapshots are the only record of how the ecosystem's
// catalogs evolve. Derived files (collections.json, shipped.json) are
// computed from these snapshots by a separate script.
//
// Usage, from apps/web:
//   node --env-file=.env.local scripts/ingest.mjs
//
// Per item we keep name, type and dependencies — names feed the day-to-day
// diff, types and dependencies feed the collection queries.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { put } from "@vercel/blob";

const CONCURRENCY = 6;
const ATTEMPTS = 5;
const FETCH_TIMEOUT_MS = 20_000;

// Mirrors getRegistryJsonUrl in lib/fetch-utils.ts — the shadcn convention
// serves the index at /r/registry.json; registry_url overrides when set.
function indexUrl(entry) {
  if (entry.registry_url) return entry.registry_url;
  return `${entry.url.replace(/\/$/, "")}/r/registry.json`;
}

async function fetchWithRetries(url) {
  let lastError = "unknown";
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        // Same identity as lib/fetch-utils.ts — the project presents one UA.
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; registry-directory/1.0; +https://registry.directory)",
        },
        redirect: "follow",
      });
      if (res.ok) return { json: await res.json() };
      lastError = `HTTP ${res.status}`;
      // 429s deserve real patience; other statuses a short breather.
      const wait = res.status === 429 ? 15_000 * attempt : 2_000 * attempt;
      if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, wait));
    } catch (error) {
      lastError = error?.message?.slice(0, 80) ?? "fetch failed";
      if (attempt < ATTEMPTS)
        await new Promise((r) => setTimeout(r, 2_000 * attempt));
    }
  }
  return { error: `${lastError} (after ${ATTEMPTS} attempts)` };
}

function slimItems(indexJson) {
  return (indexJson.items ?? [])
    .filter((item) => item?.name)
    .map((item) => {
      const slim = { name: item.name, type: item.type };
      if (Array.isArray(item.dependencies) && item.dependencies.length > 0) {
        slim.dependencies = item.dependencies;
      }
      return slim;
    });
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("BLOB_READ_WRITE_TOKEN missing — run with --env-file=.env.local");
    process.exit(1);
  }

  const directoryPath = join(process.cwd(), "public/directory.json");
  const { registries: entries } = JSON.parse(await readFile(directoryPath, "utf8"));

  const registries = {};
  const queue = [...entries];
  let done = 0;

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const entry = queue.shift();
      const url = indexUrl(entry);
      const result = await fetchWithRetries(url);
      done += 1;
      if (result.json) {
        const items = slimItems(result.json);
        registries[entry.name] = { url, items };
        console.log(`[${done}/${entries.length}] ${entry.name}: ${items.length} items`);
      } else {
        registries[entry.name] = { url, error: result.error };
        console.log(`[${done}/${entries.length}] ${entry.name}: ${result.error}`);
      }
    }
  });
  await Promise.all(workers);

  const ok = Object.values(registries).filter((r) => r.items).length;
  const failed = entries.length - ok;
  const date = new Date().toISOString().slice(0, 10);
  const snapshot = {
    date,
    generatedAt: new Date().toISOString(),
    counts: { registries: entries.length, ok, failed },
    registries,
  };

  const body = JSON.stringify(snapshot);
  const blob = await put(`snapshots/${date}.json`, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  console.log(`\nsnapshot ${date}: ${ok}/${entries.length} indexes, ${(body.length / 1024).toFixed(0)} KB`);
  console.log(`written to ${blob.url}`);
  if (failed > 0) {
    const names = Object.entries(registries)
      .filter(([, r]) => r.error)
      .map(([name, r]) => `${name} (${r.error})`);
    console.log(`failed: ${names.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
