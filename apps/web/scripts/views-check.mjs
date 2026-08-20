// Prebuild guard. Runs before every `next build` (pnpm's prebuild hook) and
// refuses to build against data that does not describe itself honestly.
//
//   pnpm views:check    (from apps/web)
//
// A file that lies is worse than a page that is slow. The build now renders
// entirely from data/, so a missing view or a manifest that overcounts turns
// into a published page claiming a registry has no components. Every check
// below answers one question: does data/ say what it contains?
//
// Deliberately NOT checked: how old the data is. Deciding when to re-index is
// a deliberate choice, and a guard that expires on a calendar would block a
// hotfix for a reason unrelated to the fix.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  DATA_DIR,
  REGISTRIES_DIR,
  listRegistryFiles,
  loadDirectory,
  indexUrl,
  registryKey,
} from "./lib/data-io.mjs";

const problems = [];
const notes = [];

function fail(message) {
  problems.push(message);
}

async function parseJson(path, label) {
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch {
    fail(`${label} is missing (${path})`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
    return null;
  }
}

async function main() {
  const manifest = await parseJson(join(DATA_DIR, "manifest.json"), "data/manifest.json");
  if (!manifest) return report();

  if (!Array.isArray(manifest.registries)) {
    fail("data/manifest.json has no registries array");
    return report();
  }

  // 1. Every registry the manifest claims a view for has a readable view
  //    whose item count matches what the manifest advertises. Records marked
  //    "missing" are the opposite claim — they must have no file at all.
  let items = 0;
  for (const record of manifest.registries) {
    if (record.status === "missing") {
      const orphan = await readFile(join(REGISTRIES_DIR, `${record.key}.json`), "utf8")
        .then(() => true)
        .catch(() => false);
      if (orphan) {
        fail(
          `manifest marks ${record.name} as missing, but data/registries/${record.key}.json exists`
        );
      }
      continue;
    }

    const view = await parseJson(
      join(REGISTRIES_DIR, `${record.key}.json`),
      `data/registries/${record.key}.json (${record.name})`
    );
    if (!view) continue;

    if (!Array.isArray(view.items)) {
      fail(`data/registries/${record.key}.json has no items array`);
      continue;
    }
    if (view.items.length !== record.items) {
      fail(
        `data/registries/${record.key}.json holds ${view.items.length} items, manifest claims ${record.items}`
      );
    }
    if (!view.itemBase) {
      fail(`data/registries/${record.key}.json has no itemBase — /r could not resolve its items`);
    }

    // Identity, not just quantity. A file whose contents belong to a different
    // registry has the right shape and can have the right item count; only the
    // fields that name it catch the swap, and the runtime looks a view up by
    // key, so a crossed file is served under the wrong registry.
    if (view.key !== record.key) {
      fail(
        `data/registries/${record.key}.json declares key "${view.key}" — the file and the manifest disagree about which registry it is`
      );
    }
    if (view.entry !== record.name) {
      fail(
        `data/registries/${record.key}.json declares entry "${view.entry}", manifest says "${record.name}"`
      );
    }
    if (view.indexUrl !== record.url) {
      fail(
        `data/registries/${record.key}.json was built from ${view.indexUrl}, manifest records ${record.url}`
      );
    }
    if (view.resolvable !== record.resolvable) {
      fail(
        `data/registries/${record.key}.json says resolvable=${view.resolvable}, manifest says ${record.resolvable}`
      );
    }
    if (Boolean(view.embedsContent) !== Boolean(record.originEmbedsContent)) {
      fail(
        `data/registries/${record.key}.json says embedsContent=${Boolean(view.embedsContent)}, manifest says ${Boolean(record.originEmbedsContent)}`
      );
    }

    // The item contract the site renders and /r resolves against. A nameless
    // item produces a link to nowhere; a duplicate name makes one of the two
    // unreachable, because a name is how an item is addressed.
    const seen = new Set();
    let nameless = 0;
    let untyped = 0;
    let duplicated = 0;
    for (const item of view.items) {
      if (!item?.name || typeof item.name !== "string") {
        nameless += 1;
        continue;
      }
      if (!item.type || typeof item.type !== "string") untyped += 1;
      if (seen.has(item.name)) duplicated += 1;
      seen.add(item.name);
    }
    if (nameless > 0) {
      fail(`data/registries/${record.key}.json has ${nameless} item(s) without a name`);
    }
    if (untyped > 0) {
      fail(`data/registries/${record.key}.json has ${untyped} item(s) without a type`);
    }
    if (duplicated > 0) {
      fail(
        `data/registries/${record.key}.json has ${duplicated} duplicate item name(s) — each one shadows an item that can no longer be addressed`
      );
    }

    items += view.items.length;
  }

  // Two records claiming the same file is the crossed-view failure seen from
  // the manifest side: whichever is read second silently wins.
  const keys = new Set();
  for (const record of manifest.registries) {
    if (keys.has(record.key)) {
      fail(`manifest lists key "${record.key}" more than once`);
    }
    keys.add(record.key);
  }

  if (manifest.counts?.items !== undefined && manifest.counts.items !== items) {
    fail(`manifest counts.items is ${manifest.counts.items}, the views hold ${items}`);
  }

  // 2. No view on disk that the manifest does not account for. An orphan is
  //    data from a registry that left the directory, and it would still be
  //    served by /r.
  const declared = new Set(
    manifest.registries.filter((r) => r.status !== "missing").map((r) => `${r.key}.json`)
  );
  const onDisk = await listRegistryFiles();
  for (const file of onDisk) {
    if (!declared.has(file)) fail(`data/registries/${file} is not listed in the manifest`);
  }
  if (manifest.counts?.views !== undefined && manifest.counts.views !== onDisk.length) {
    fail(`manifest counts.views is ${manifest.counts.views}, data/registries holds ${onDisk.length}`);
  }

  // 3. directory.json, the manifest and the views describe the same set of
  //    registries, one to one. A key that merely exists is not enough: the
  //    runtime looks a registry up by the name in directory.json, so a record
  //    filed under the right key but carrying a stale name resolves to null
  //    and the page renders empty. Recomputing name and index URL from the
  //    entry is what ties the three files to one another instead of leaving
  //    each internally consistent and collectively wrong.
  const byKey = new Map(manifest.registries.map((r) => [r.key, r]));
  const unaccounted = [];
  const directory = await loadDirectory();
  const expectedKeys = new Set();

  for (const entry of directory) {
    const key = registryKey(entry);
    // Two entries deriving the same key would share one view: whichever the
    // runtime resolves second gets the other's catalog.
    if (expectedKeys.has(key)) {
      fail(
        `public/directory.json has two entries that resolve to key ${key} ("${entry.name}") — one view cannot serve both`
      );
    }
    expectedKeys.add(key);
    const record = byKey.get(key);
    if (!record) {
      unaccounted.push(entry.name);
      continue;
    }
    if (record.name !== entry.name) {
      fail(
        `manifest records "${record.name}" for key ${key}, public/directory.json now calls it "${entry.name}" — re-index so the two agree`
      );
    }
    const url = indexUrl(entry);
    if (record.url !== url) {
      fail(
        `manifest built ${key} from ${record.url}, public/directory.json now points at ${url} — the view holds data from the old origin`
      );
    }
  }

  // A record for a registry the directory no longer lists is the mirror of an
  // unaccounted entry: data nothing can reach, still counted in the totals.
  const stale = manifest.registries
    .filter((r) => !expectedKeys.has(r.key))
    .map((r) => r.name);
  if (stale.length > 0) {
    fail(
      `${stale.length} manifest record(s) name registries absent from public/directory.json: ${stale.join(", ")}`
    );
  }
  if (
    manifest.counts?.directory !== undefined &&
    manifest.counts.directory !== directory.length
  ) {
    fail(
      `manifest counts.directory is ${manifest.counts.directory}, public/directory.json holds ${directory.length}`
    );
  }
  if (unaccounted.length > 0) {
    fail(
      `${unaccounted.length} registry(ies) in public/directory.json are absent from data/manifest.json: ${unaccounted.join(", ")}\n` +
        `    Run \`pnpm index\` from apps/web and commit data/ before building.`
    );
  }

  // 4. The companion files parse. Absent is tolerated for the derived pair —
  //    nothing renders them yet — but malformed never is.
  await parseJson(join(DATA_DIR, "github.json"), "data/github.json");
  for (const name of ["collections.json", "shipped.json"]) {
    try {
      await readFile(join(DATA_DIR, name), "utf8");
      await parseJson(join(DATA_DIR, name), `data/${name}`);
    } catch {
      notes.push(`data/${name} absent — no consumer yet, not treated as an error`);
    }
  }

  // 5. Recorded gaps, surfaced but never fatal. A registry whose origin is
  //    permanently gone would otherwise block every build forever, and the
  //    removing it from the directory is a separate, deliberate change.
  const missing = manifest.registries.filter((r) => r.status === "missing");
  if (missing.length > 0) {
    notes.push(
      `${missing.length} registry(ies) had no reachable index at ${manifest.date}: ${missing
        .map((m) => `${m.name} (${m.error ?? "unknown"})`)
        .join(", ")}`
    );
  }

  const reusedViews = manifest.registries.filter((r) => r.status === "reused");
  if (reusedViews.length > 0) {
    notes.push(
      `${reusedViews.length} view(s) reused from an earlier run: ${reusedViews
        .map((m) => m.name)
        .join(", ")}`
    );
  }

  // 6. Age, reported and never fatal. Committed data does not refresh itself:
  //    an origin that was down when it was indexed stays down in data/ until
  //    someone runs the indexer again. Stale data is a legitimate choice — the
  //    re-indexing is a deliberate act — so the guard's job is to make sure
  //    that choice is never made by forgetting. Old but honest still builds.
  const age = daysSince(manifest.date);
  if (age !== null && age >= STALE_AFTER_DAYS) {
    notes.push(
      `data/ was generated ${age} days ago (${manifest.date}) — run \`pnpm index\` to refresh it`
    );
  }

  report(manifest, items);
}

// Long enough that a normal working rhythm never trips it, short enough that
// data nobody has looked at in two weeks announces itself.
const STALE_AFTER_DAYS = 14;

// Calendar days between the manifest's date and today, both read as UTC dates
// so a run late at night does not read as a day older than it is.
function daysSince(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) return null;
  const then = Date.parse(`${date}T00:00:00Z`);
  const today = new Date();
  const now = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  return Math.max(0, Math.round((now - then) / 86_400_000));
}

function report(manifest, items = 0) {
  for (const note of notes) console.log(`views:check  note: ${note}`);

  if (problems.length > 0) {
    console.error(`\nviews:check FAILED — data/ does not describe itself honestly:\n`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    console.error("");
    process.exit(1);
  }

  // Unreachable in practice: every early return above records a problem
  // first. Explicit anyway, so a future edit cannot turn a missing manifest
  // into a silent pass.
  if (!manifest) process.exit(1);

  const views = manifest.registries.filter((r) => r.status !== "missing").length;
  console.log(
    `views:check ok — ${views} views, ${items.toLocaleString("en-US")} items, generated ${manifest.date}`
  );
}

main().catch((error) => {
  console.error("views:check crashed:", error);
  process.exit(1);
});
