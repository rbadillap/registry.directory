// The indexer. One command produces everything the site reads:
//
//   pnpm index          (from apps/web)
//
// Order matters. Registry views come first because collections profile them;
// github stats come second because collections rank by stars; the derived
// surfaces come third; the manifest is written last, because it describes
// what the three steps actually produced.
//
// This runs locally, never on Vercel. That is the whole point: patient
// retries against a rate-limited registry are free
// here and ruinous inside a build.

import { join } from "node:path";
import {
  DATA_DIR,
  REGISTRIES_DIR,
  formatKB,
  listRegistryFiles,
  loadDirectory,
  readJsonFile,
  registryKey,
  today,
  writeJsonFile,
} from "./lib/data-io.mjs";
import { indexRegistries } from "./steps/registries.mjs";
import { indexGithub } from "./steps/github.mjs";
import { indexDerived } from "./steps/derived.mjs";

// Flags:
//   --only=key,key   refresh just those views and merge them into the existing
//                    manifest. Recovering one throttled registry should not mean
//                    re-fetching the other 74 and earning a fresh round of 429s.
//   --retry          spend minutes cooling down and re-asking the origins that
//                    answered 429/5xx. Off by default: the main run reports what
//                    it could not reach and prints the command to come back for
//                    it, instead of making every run wait on the same few sites.
function parseOnly() {
  const arg = process.argv.find((a) => a.startsWith("--only="));
  if (!arg) return null;
  const keys = arg
    .slice("--only=".length)
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return keys.length > 0 ? new Set(keys) : null;
}

async function main() {
  const started = Date.now();
  const only = parseOnly();
  const retry = process.argv.includes("--retry");

  console.log("→ step 1/4  registry indexes");
  const records = await indexRegistries({ only, retry });

  console.log("\n→ step 2/4  github stats");
  // A targeted run is about registry views; leaving github.json untouched
  // keeps it from spending 66 API calls to change nothing.
  const github = only
    ? { total: Object.keys((await readJsonFile(join(DATA_DIR, "github.json"))) ?? {}).length }
    : await indexGithub();
  if (only) console.log("github: skipped on a partial run");

  console.log("\n→ step 3/4  derived surfaces");
  const directory = await loadDirectory();
  const views = new Map(
    (
      await Promise.all(
        directory.map(async (entry) => [
          entry.name,
          await readJsonFile(join(REGISTRIES_DIR, `${registryKey(entry)}.json`)),
        ])
      )
    ).filter(([, view]) => view)
  );
  const derived = await indexDerived(views);

  console.log("\n→ step 4/4  manifest");

  // A partial run refreshed some records; the rest of the manifest still
  // describes disk correctly, so it is merged rather than rebuilt. A full run
  // replaces the list outright.
  const toRecord = (r) => ({
    key: r.key,
    name: r.name,
    url: r.url,
    items: r.items,
    status: r.status,
    resolvable: r.resolvable ?? true,
    ...(r.embedsContent ? { originEmbedsContent: true } : {}),
    ...(r.error ? { error: r.error } : {}),
  });

  const priorManifest = await readJsonFile(join(DATA_DIR, "manifest.json"));

  let entries = records.map(toRecord);
  if (only) {
    const previous = priorManifest?.registries ?? [];
    const merged = new Map(previous.map((r) => [r.key, r]));
    for (const record of entries) merged.set(record.key, record);
    entries = [...merged.values()];
  }
  entries.sort((a, b) => a.key.localeCompare(b.key));

  const ok = entries.filter((r) => r.status === "ok");
  const reusedViews = entries.filter((r) => r.status === "reused");
  const missing = entries.filter((r) => r.status === "missing");
  const files = await listRegistryFiles();

  const manifest = {
    // The generation date lives here and only here. Nothing renders it: a
    // timestamp on a page changes the output of every run even when no data
    // changed, and a changed output is an ISR write nobody asked for.
    generatedAt: new Date().toISOString(),
    // The date answers "how old is this data as a whole", so only a run that
    // looked at every registry may advance it. A targeted run refreshes a few
    // views and leaves the rest untouched: stamping it with today would report
    // the whole catalog as fresh on the strength of one file.
    date: only ? (priorManifest?.date ?? today()) : today(),
    counts: {
      directory: entries.length,
      views: files.length,
      ok: ok.length,
      reused: reusedViews.length,
      missing: missing.length,
      items: entries.reduce((sum, r) => sum + r.items, 0),
      github: github.total,
      collections: derived.collections,
    },
    // Every directory entry appears here, including the ones with no view.
    // A registry the indexer could not reach is a recorded gap, not a
    // silence: the guard checks that this list covers public/directory.json
    // exactly, so the only thing that fails a build is a manifest that has
    // stopped describing the directory it claims to describe.
    registries: entries,
  };

  await writeJsonFile(join(DATA_DIR, "manifest.json"), manifest);

  const bytes = await dataSize();
  const elapsed = ((Date.now() - started) / 1000).toFixed(0);
  console.log(
    `\ndata/ — ${manifest.counts.views} views, ${manifest.counts.items.toLocaleString("en-US")} items, ${formatKB(bytes)} on disk`
  );
  console.log(
    `ok ${ok.length} · reused ${reusedViews.length} · missing ${missing.length} · ${elapsed}s`
  );
  if (reusedViews.length > 0) {
    console.log(`reused: ${reusedViews.map((r) => `${r.name} (${r.error})`).join(", ")}`);
  }
  if (missing.length > 0) {
    console.log(`\nMISSING (${missing.length}):`);
    for (const r of missing) console.log(`  ${r.key.padEnd(24)} ${r.error} — ${r.name}`);

    // A quarantined origin is worth a second chance only when its answer was
    // "wait" or "my fault": 429 and 5xx come back, 402/403/404 do not. The
    // command below names just the retryable ones, so it is safe to paste.
    const retryable = missing.filter(
      (r) => !/HTTP (400|401|402|403|404|405|410|451)\b/.test(r.error ?? "")
    );
    if (retryable.length > 0) {
      console.log(
        `\nto retry the ${retryable.length} throttled one(s) — patient, minutes long:\n` +
          `  pnpm index --only=${retryable.map((r) => r.key).join(",")} --retry`
      );
    }
    const definitive = missing.filter((r) => !retryable.includes(r));
    if (definitive.length > 0) {
      console.log(
        `\n${definitive.length} answered definitively (gated or gone); retrying will not change it: ` +
          definitive.map((r) => r.key).join(", ")
      );
    }
  }
}

async function dataSize() {
  const { stat } = await import("node:fs/promises");
  let total = 0;
  for (const file of await listRegistryFiles()) {
    total += (await stat(join(REGISTRIES_DIR, file))).size;
  }
  for (const file of ["github.json", "collections.json", "shipped.json", "manifest.json"]) {
    total += await stat(join(DATA_DIR, file))
      .then((s) => s.size)
      .catch(() => 0);
  }
  return total;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
