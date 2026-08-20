// Step 1 of the indexer: fetch every registry index, write one slim view per
// registry to data/registries/{key}.json, probe whether the origin still
// serves individual items, and archive the raw slim snapshot to Vercel Blob.
//
// Usage, standalone, from apps/web:
//   node --env-file=.env.local scripts/steps/registries.mjs

import { join } from "node:path";
import { head, put } from "@vercel/blob";
import {
  CONCURRENCY,
  REGISTRIES_DIR,
  USER_AGENT,
  fetchWithRetries,
  indexUrl,
  itemBaseUrl,
  listRegistryFiles,
  loadDirectory,
  mapPool,
  readJsonFile,
  registryKey,
  sleep,
  today,
  writeJsonFile,
} from "../lib/data-io.mjs";

// A registry may answer the bare GET with one page plus a pagination object.
// Without following it we would persist 50 items for catalogs that hold
// thousands.
const MAX_PAGINATION_PAGES = 100;

// Walks the remaining pages. Returns { index } only when the catalog was read
// in full; every other outcome is { error }.
//
// Success has exactly one shape: a page said there is no more. Everything else
// that stops the loop — a failed fetch, an empty page that still claims more,
// pages that stop adding anything new, the page ceiling — leaves a shorter
// catalog than the origin holds, and a view that under-reports itself is
// indistinguishable from a registry that deleted half its components.
//
// Names are deduplicated as pages arrive, because that is the count that has
// to reach the total: an origin that serves overlapping windows can hand over
// `total` raw items that collapse into fewer real ones.
async function fetchRemainingPages(url, first) {
  const items = [];
  const seen = new Set();
  const take = (page) => {
    let added = 0;
    for (const item of page ?? []) {
      if (!item?.name || seen.has(item.name)) continue;
      seen.add(item.name);
      items.push(item);
      added += 1;
    }
    return added;
  };
  take(first.items);

  const pageSize = first.pagination?.limit || items.length || 100;
  const expected = first.pagination?.total;
  let complete = false;

  for (let page = 0; page < MAX_PAGINATION_PAGES; page++) {
    const paged = new URL(url);
    paged.searchParams.set("limit", String(pageSize));
    paged.searchParams.set("offset", String(items.length));

    const result = await fetchWithRetries(paged.toString(), { attempts: 3 });
    if (!result.json) {
      return { error: `${result.error} (page ${page + 2}, ${items.length} items in)` };
    }

    const added = take(result.json.items);
    if (result.json.pagination?.hasMore === false) {
      complete = true;
      break;
    }
    // Still claiming more, but this page moved nothing: the offset is not
    // advancing and another request would ask the same question forever.
    if (added === 0) {
      return {
        error: `pagination stalled at ${items.length} items with more claimed`,
      };
    }
  }

  if (!complete) {
    return {
      error: `pagination did not finish within ${MAX_PAGINATION_PAGES} pages (${items.length} items in)`,
    };
  }

  // The origin said how many items to expect, counted after collapsing repeats.
  if (typeof expected === "number" && items.length !== expected) {
    return {
      error: `pagination returned ${items.length} distinct items, origin declared ${expected}`,
    };
  }

  return { index: { ...first, items } };
}

// Only paths, types and targets. Never `content`: data/ carries metadata, the
// item source stays at the origin.
function slimFiles(files) {
  if (!Array.isArray(files)) return undefined;
  const slim = [];
  for (const file of files) {
    if (!file || typeof file.path !== "string") continue;
    const entry = { path: file.path };
    if (file.type) entry.type = file.type;
    if (file.target) entry.target = file.target;
    slim.push(entry);
  }
  return slim.length > 0 ? slim : undefined;
}

function optionalArray(value) {
  return Array.isArray(value) && value.length > 0 ? value : undefined;
}

// The fields the site actually renders from an index, and nothing else.
//
// Kept because something reads them: name/type/title/description feed the
// item list and metadata, categories feed the landing's semantic groups,
// dependencies feed the info panel and the collection queries,
// registryDependencies feed the info panel, cssVars feed the synthetic
// globals.css the viewer builds for theme items, files[].path gates which
// items get a page at all.
//
// Dropped because nothing reads them from an index: author, meta, docs,
// tailwind, css, devDependencies — and files[].content, which is the whole
// point.
function slimItem(item) {
  return {
    name: item.name,
    type: item.type,
    title: item.title || undefined,
    description: item.description || undefined,
    categories: optionalArray(item.categories),
    dependencies: optionalArray(item.dependencies),
    registryDependencies: optionalArray(item.registryDependencies),
    cssVars:
      item.cssVars && Object.keys(item.cssVars).length > 0
        ? item.cssVars
        : undefined,
    files: slimFiles(item.files),
  };
}

// A registry whose sampled items all fail definitively is fully gated or
// broken — listing it in /r would turn every install into our 502. Sampling
// first/middle/last keeps partially-gated registries in. Transient failures
// (429, 5xx, timeouts) get the benefit of the doubt.
//
// This probe used to run inside the Vercel build (lib/catalog.ts). It runs
// here now: the indexer probes, the build reads the conclusion.
const GATED_STATUSES = new Set([401, 402, 403, 404, 410]);

async function probeResolvable(base, names) {
  const samples = [
    ...new Set(
      [
        names[0],
        names[Math.floor(names.length / 2)],
        names[names.length - 1],
      ].filter(Boolean),
    ),
  ];
  if (samples.length === 0) return true;

  const statuses = await Promise.all(
    samples.map(async (name) => {
      try {
        const res = await fetch(`${base}/${name}.json`, {
          signal: AbortSignal.timeout(10_000),
          headers: { "user-agent": USER_AGENT },
          redirect: "follow",
        });
        await res.body?.cancel();
        return res.status;
      } catch {
        return 0;
      }
    }),
  );

  let allGated = true;
  for (const status of statuses) {
    if (status >= 200 && status < 300) return true;
    if (!GATED_STATUSES.has(status)) allGated = false;
  }
  return !allGated;
}

function viewPath(key) {
  return join(REGISTRIES_DIR, `${key}.json`);
}

export async function indexRegistries({ probe = true, only = null, retry = false } = {}) {
  const directory = await loadDirectory();

  // A key collision would let one registry silently shadow another's view.
  // Checked across the whole directory even on a partial run — uniqueness is
  // a property of the directory, not of the subset being refreshed.
  const byKey = new Map();
  for (const entry of directory) {
    const key = registryKey(entry);
    if (byKey.has(key)) {
      throw new Error(
        `Registry key collision on "${key}": "${byKey.get(key).name}" and "${entry.name}". ` +
          `Give one of them a distinct namespace in public/directory.json.`,
      );
    }
    byKey.set(key, entry);
  }

  const entries = only
    ? directory.filter((entry) => only.has(registryKey(entry)))
    : directory;

  if (only) {
    const unknown = [...only].filter((key) => !byKey.has(key));
    if (unknown.length > 0) {
      throw new Error(`--only names no such registry key: ${unknown.join(", ")}`);
    }
    console.log(`partial run: ${entries.map((e) => e.name).join(", ")}`);
  }

  let done = 0;
  const label = (entry) => `[${++done}/${entries.length}] ${entry.name}`;
  const records = await mapPool(
    entries,
    (entry) => indexOne(entry, probe, label),
    CONCURRENCY,
  );

  // No waiting in the main pass. An origin that answered 429 or 5xx is very
  // likely to answer the same thing minutes later — several have been doing
  // it for days — so the run records the verdict and moves on instead of
  // spending its wall clock on a cooldown. The retry pass only runs when
  // asked for explicitly, with --retry, and the summary prints the exact
  // command to do it.
  if (retry) await retryMissing(records, probe);

  // A partial run knows nothing about the registries it skipped, so it must
  // not prune "orphans" it simply did not look at, and must not write a
  // day's snapshot that would claim to be the whole ecosystem.
  if (only) {
    console.log("partial run: orphan prune and snapshot archive skipped");
  } else {
    await pruneOrphans(records);
    await archiveSnapshot(records, directory.length);
  }

  // `snapshot` and `entry` are working state for this step only — the
  // manifest must not carry a copy of directory.json around.
  return records.map(
    ({ snapshot: _snapshot, entry: _entry, ...record }) => record,
  );
}

const RETRY_ROUNDS = 2;
const RETRY_COOLDOWN_MS = 120_000;
const RETRY_ATTEMPTS = 2;

// A definitive answer is an answer. 404 means the index moved, 402/403/401
// mean the catalog is paywalled or private — retrying those just spends
// minutes to be told the same thing, and the manifest records the verdict
// either way. Only "wait" (429), server faults (5xx) and network errors earn
// a second chance.
const DEFINITIVE_ERROR = /HTTP (400|401|402|403|404|405|410|451)\b/;

function worthRetrying(record) {
  return record.status === "missing" && !DEFINITIVE_ERROR.test(record.error ?? "");
}

// Only reached with --retry. Patience is affordable on this machine and
// impossible in a Vercel build, but it is opt-in: the caller chooses when
// to spend the minutes, and on which origins.
async function retryMissing(records, probe) {
  for (let round = 1; round <= RETRY_ROUNDS; round++) {
    const stuck = records.filter(worthRetrying);
    if (stuck.length === 0) return;

    console.log(
      `\nretry ${round}/${RETRY_ROUNDS}: cooling down ${RETRY_COOLDOWN_MS / 1000}s before ${stuck.length} throttled origin(s) — ${stuck
        .map((r) => r.name)
        .join(", ")}`,
    );
    await sleep(RETRY_COOLDOWN_MS);

    // One at a time: several of these origins sit behind the same edge, and
    // retrying them in parallel is what earned the 429 in the first place.
    //
    // The record is replaced wholesale, never merged: merging would leave the
    // failed attempt's `error` sitting on a record that now says "ok", and a
    // manifest reporting an error for a healthy registry is the kind of lie
    // this whole layer exists to stop telling.
    for (const record of stuck) {
      const retried = await indexOne(
        record.entry,
        probe,
        (e) => `  retry ${e.name}`,
        RETRY_ATTEMPTS,
      );
      records[records.indexOf(record)] = retried;
    }
  }
}

// Fetch one registry's index and persist its view. Returns the record the
// manifest is built from; `label` is injected so the main pass can number
// its lines and the retry pass can mark its own. The retry pass asks for
// fewer attempts because it has already waited out the rate limit.
// Every way a read can fail lands here: an unreachable origin, or a catalog
// that could only be read in part. Reuses the view from an earlier run when
// there is one, so a bad afternoon at one origin cannot empty a page that
// worked yesterday.
async function failedRead(entry, key, url, error, label) {
  const previous = await readJsonFile(viewPath(key));

  // A reusable view is one that describes the same registry this entry now
  // names. If the directory has since been renamed or repointed, the old file
  // holds a different registry's catalog under a matching key — serving it
  // would answer today's URL with yesterday's origin, so it is treated as if
  // there were no view at all.
  const sameRegistry =
    previous && previous.entry === entry.name && previous.indexUrl === url;

  if (previous && !sameRegistry) {
    console.log(
      `${label(entry)}: ${error} — the view on disk describes ${previous.entry} at ${previous.indexUrl}, not reusing it`,
    );
  }

  if (sameRegistry) {
    console.log(`${label(entry)}: ${error} — reused (${previous.items.length} items)`);
    return {
      key,
      entry,
      name: entry.name,
      url,
      items: previous.items.length,
      status: "reused",
      error,
      resolvable: previous.resolvable,
      ...(previous.originEmbedsContent ? { originEmbedsContent: true } : {}),
      snapshot: {
        url,
        items: previous.items.map((i) => ({
          name: i.name,
          type: i.type,
          ...(i.dependencies ? { dependencies: i.dependencies } : {}),
        })),
      },
    };
  }

  if (!previous) console.log(`${label(entry)}: ${error} — no previous view to reuse`);
  return { key, entry, name: entry.name, url, items: 0, status: "missing", error };
}

async function indexOne(entry, probe, label, attempts) {
  const key = registryKey(entry);
  const url = indexUrl(entry);
  const result = await fetchWithRetries(url, attempts ? { attempts } : {});

  if (!result.json) {
    return failedRead(entry, key, url, result.error, label);
  }

  let index = result.json;
  if (index.pagination?.hasMore) {
    console.log(
      `  ${entry.name} paginates (${index.items?.length ?? 0}/${index.pagination.total}), fetching remaining pages`,
    );
    const paged = await fetchRemainingPages(url, index);
    if (paged.error) {
      // A half-read catalog is worse than an old one: it looks healthy and is
      // wrong. Fall back to the same path a failed first page takes.
      return failedRead(entry, key, url, paged.error, label);
    }
    index = paged.index;
  }

  // A name is how an item is addressed — by a page URL, by /r, by search — so
  // two items sharing one is one item nobody can reach. Some registries do it
  // deliberately, registering style variants under a single name. Keeping the
  // first match is the behaviour the aggregated catalog already had.
  const rawItems = [];
  const claimed = new Set();
  let shadowed = 0;
  for (const item of index.items ?? []) {
    if (!item?.name) continue;
    if (claimed.has(item.name)) {
      shadowed += 1;
      continue;
    }
    claimed.add(item.name);
    rawItems.push(item);
  }
  if (shadowed > 0) {
    console.log(`  ${entry.name}: ${shadowed} item(s) share a name with an earlier one, keeping the first`);
  }

  const items = rawItems.map(slimItem);
  const base = itemBaseUrl(entry);

  // Provenance: some registries inline source in their index. Recording it
  // keeps the reason a view holds no file content visible in the manifest.
  const embedsContent = rawItems.some((item) => item.files?.[0]?.content);
  const resolvable = probe
    ? await probeResolvable(
        base,
        items.map((i) => i.name),
      )
    : true;

  const view = {
    key,
    entry: entry.name,
    name: index.name || entry.name,
    homepage: index.homepage || entry.url,
    indexUrl: url,
    itemBase: base,
    resolvable,
    items,
  };

  const changed = await writeJsonFile(viewPath(key), view);
  console.log(
    `${label(entry)}: ${items.length} items${resolvable ? "" : " (origin does not resolve)"}${changed ? "" : " (unchanged)"}`,
  );

  return {
    key,
    entry,
    name: entry.name,
    url,
    items: items.length,
    status: "ok",
    resolvable,
    embedsContent: embedsContent || undefined,
    snapshot: {
      url,
      items: items.map((i) => ({
        name: i.name,
        type: i.type,
        ...(i.dependencies ? { dependencies: i.dependencies } : {}),
      })),
    },
  };
}

// Views whose directory entry disappeared are stale by definition.
async function pruneOrphans(records) {
  const live = new Set(records.map((r) => `${r.key}.json`));
  const { unlink } = await import("node:fs/promises");
  for (const file of await listRegistryFiles()) {
    if (live.has(file)) continue;
    await unlink(join(REGISTRIES_DIR, file));
    console.log(`removed orphan view ${file} (no longer in directory.json)`);
  }
}

// The snapshot history is the project's only record of how the ecosystem's
// catalogs evolve — nobody else archives registry indexes. It is append-only:
// a run never rewrites a day that already exists.
async function archiveSnapshot(records, total) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("snapshot: BLOB_READ_WRITE_TOKEN missing — skipped");
    return;
  }

  const date = today();
  const pathname = `snapshots/${date}.json`;

  const existing = await head(pathname).catch(() => null);
  if (existing) {
    console.log(`snapshot ${date}: already archived, left untouched`);
    return;
  }

  const registries = {};
  for (const record of records) {
    registries[record.name] = record.snapshot
      ? record.snapshot
      : { url: record.url, error: record.error };
  }

  const ok = records.filter((r) => r.status === "ok").length;
  const body = JSON.stringify({
    date,
    generatedAt: new Date().toISOString(),
    counts: { registries: total, ok, failed: total - ok },
    registries,
  });

  // allowOverwrite stays false: it is the actual guarantee that a day's
  // record is written once and never rewritten. The head() check above only
  // makes the common case quiet — this is what makes it true.
  try {
    const blob = await put(pathname, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
    console.log(
      `snapshot ${date}: archived ${(body.length / 1024).toFixed(0)} KB → ${blob.url}`,
    );
  } catch (error) {
    // Losing today's snapshot is a gap in the archive, not a broken data
    // layer — data/ is already written. Never let it fail the whole run.
    console.log(`snapshot ${date}: not archived (${error.message.slice(0, 120)})`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const records = await indexRegistries();
  const ok = records.filter((r) => r.status === "ok").length;
  console.log(`\n${ok}/${records.length} indexes ok`);
}
