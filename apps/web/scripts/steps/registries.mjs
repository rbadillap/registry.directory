// Step 1 of the indexer: fetch every registry index, write one slim view per
// registry to data/registries/{key}.json, probe whether the origin still
// serves individual items, and archive the raw slim snapshot to Vercel Blob.
//
// Usage, standalone, from apps/web:
//   pnpm exec varlock run -- node scripts/steps/registries.mjs

import { join } from "node:path";
import { head, put } from "@vercel/blob";
import {
  CONCURRENCY,
  DEFINITIVE_ERROR,
  REGISTRIES_DIR,
  USER_AGENT,
  fetchWithRetries,
  indexUrl,
  itemBaseCandidates,
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
// Two counts are tracked, and confusing them breaks the walk. `consumed` is
// how many rows the origin has handed over — that is what `offset` means to
// it, and what its `total` counts. `items` holds one entry per distinct name,
// which is what the view can address. A source that repeats a name would make
// a deduplicated offset walk backwards and re-request pages forever.
export async function fetchRemainingPages(url, first, fetchPage = fetchWithRetries) {
  const items = [];
  const seen = new Set();
  let consumed = 0;

  const take = (page) => {
    const rows = page ?? [];
    consumed += rows.length;
    for (const item of rows) {
      if (!item?.name || seen.has(item.name)) continue;
      seen.add(item.name);
      items.push(item);
    }
    return rows.length;
  };
  take(first.items);

  const pageSize = first.pagination?.limit || consumed || 100;
  const expected = first.pagination?.total;
  let complete = false;

  for (let page = 0; page < MAX_PAGINATION_PAGES; page++) {
    const paged = new URL(url);
    paged.searchParams.set("limit", String(pageSize));
    paged.searchParams.set("offset", String(consumed));

    const result = await fetchPage(paged.toString(), { attempts: 3 });
    if (!result.json) {
      return { error: `${result.error} (page ${page + 2}, ${consumed} rows in)` };
    }

    const rows = take(result.json.items);
    if (result.json.pagination?.hasMore === false) {
      complete = true;
      break;
    }
    // Still claiming more, but the page was empty: the cursor cannot advance
    // and another request would ask the same question forever.
    if (rows === 0) {
      return { error: `pagination stalled at ${consumed} rows with more claimed` };
    }
  }

  if (!complete) {
    return {
      error: `pagination did not finish within ${MAX_PAGINATION_PAGES} pages (${consumed} rows in)`,
    };
  }

  // Compared against rows, not names: `total` counts what the origin serves,
  // and an origin is free to serve the same name twice.
  if (typeof expected === "number" && consumed !== expected) {
    return {
      error: `pagination consumed ${consumed} rows, origin declared ${expected}`,
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
// items get a page at all, and font is what makes a registry:font item valid
// at all — the schema requires it, and the CLI refuses to parse a catalog
// page that lists a font without it (the /r endpoint serves these views).
//
// Dropped because nothing reads them from an index: author, meta, docs,
// tailwind, css, devDependencies — and files[].content, which is the whole
// point.
function slimItem(item) {
  return {
    name: item.name,
    type: item.type,
    // Absent when the origin served the item to the probe. "gated" or "gone"
    // when it refused, "unverified" when it could not be asked. Written by
    // applyVerdicts after the probe; the slot keeps it next to the type.
    resolution: undefined,
    title: item.title || undefined,
    description: item.description || undefined,
    categories: optionalArray(item.categories),
    dependencies: optionalArray(item.dependencies),
    registryDependencies: optionalArray(item.registryDependencies),
    cssVars:
      item.cssVars && Object.keys(item.cssVars).length > 0
        ? item.cssVars
        : undefined,
    font:
      item.type === "registry:font" &&
      item.font &&
      typeof item.font === "object" &&
      !Array.isArray(item.font)
        ? item.font
        : undefined,
    files: slimFiles(item.files),
  };
}

// A registry whose sampled items all fail definitively is fully gated or
// broken — listing it in /r would turn every install into our 502. Sampling
// first/middle/last keeps partially-gated registries in. Transient failures
// (429, 5xx, timeouts) get the benefit of the doubt.
//
// Probing belongs here rather than in the build: it costs a few requests per
// registry, and the build only needs the conclusion.
const GATED_STATUSES = new Set([401, 402, 403, 404, 410]);

// One request, no body. What matters is the status the origin puts on an
// item, and whether what it serves is JSON at all; the content itself stays
// at the origin. `retryAfterMs` is only set when the origin asked to wait.
async function fetchAnswer(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": USER_AGENT },
      redirect: "follow",
    });
    await res.body?.cancel();
    const retryAfter = Number(res.headers.get("retry-after"));
    return {
      status: res.status,
      contentType: res.headers.get("content-type") ?? "",
      retryAfterMs: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined,
    };
  } catch {
    return { status: 0, contentType: "" };
  }
}

async function fetchStatus(url) {
  return (await fetchAnswer(url)).status;
}

function sampleNames(names) {
  return [
    ...new Set(
      [
        names[0],
        names[Math.floor(names.length / 2)],
        names[names.length - 1],
      ].filter(Boolean),
    ),
  ];
}

// Walks the candidate bases in order and settles on the first one where a
// sampled item answers 2xx. When none does, the primary base is kept and the
// verdict is read from its statuses alone: all definitive failures means
// gated or broken, anything transient keeps the benefit of the doubt.
//
// Exported for the tests; `status` is the network, replaceable by a stub.
export async function resolveItemBase(candidates, names, status = fetchStatus) {
  const [primary] = candidates;
  const samples = sampleNames(names);
  if (samples.length === 0) return { itemBase: primary, resolvable: true };

  let primaryStatuses = null;
  for (const base of candidates) {
    const statuses = await Promise.all(
      samples.map((name) => status(`${base}/${name}.json`)),
    );
    if (base === primary) primaryStatuses = statuses;
    if (statuses.some((s) => s >= 200 && s < 300)) {
      return { itemBase: base, resolvable: true };
    }
  }

  const allGated = primaryStatuses.every((s) => GATED_STATUSES.has(s));
  return { itemBase: primary, resolvable: !allGated };
}

// Every item of a resolvable registry is asked for once, and the ones the
// origin refuses are marked in the view. The registry-level sample above
// settles where items live and whether the origin serves anything at all;
// this settles, item by item, what /r may list. Listing an item the origin
// will not serve turns the install into our 502, and the official index
// samples our catalog daily and counts each of those as a failure of ours.
//
// Two verdicts, both definitive:
//   gated — 401, 402 or 403: the item exists behind a paywall or a login
//   gone  — 404 or 410, or a 2xx that serves a web page instead of JSON:
//           the index lists an item the origin no longer serves
//
// Everything else — 429, 5xx, a timeout — keeps the benefit of the doubt
// after a short retry: a rate limit is a request to wait, not an answer
// about the item, and the manifest should not record a bad afternoon as a
// paywall.
//
// Four requests in flight per origin. The indexer already runs several
// registries at once, and an origin that answers 429 to a burst is the
// reason the retry waits instead of hammering.
//
// The probe never waits out a rate limit — same rule as the main run. An
// origin that asks for a longer breather than the cap, or keeps answering
// 429 after the retries, has said all it will say today: the rest of its
// items are left unprobed. Without this, one origin with an hourly quota
// and four thousand items turns a five-minute run into a day. An unprobed
// item is marked "unverified" unless an earlier run already reached it
// (applyVerdicts), and /r lists only what was verified.
const ITEM_PROBE_CONCURRENCY = 4;
const ITEM_PROBE_ATTEMPTS = 3;
const ITEM_PROBE_MAX_WAIT_MS = 30_000;
const ITEM_PROBE_THROTTLE_GIVEUPS = 3;

function verdictFor({ status, contentType }) {
  if (status === 401 || status === 402 || status === 403) return "gated";
  if (status === 404 || status === 410) return "gone";
  if (status >= 200 && status < 300 && /text\/html/i.test(contentType)) return "gone";
  return undefined;
}

function isTransient(status) {
  return status === 0 || status === 408 || status === 429 || status >= 500;
}

// Returns { verdicts, unprobed }: a Map of item name → verdict holding only
// the items the origin refused, and the names never asked because the origin
// throttled the probe. Exported for the tests; `answer` is the network,
// `wait` the clock and `start` the first item asked, all replaceable.
//
// The order starts at a random item. An origin with a quota answers the
// first few hundred requests of every run and refuses the rest, so a probe
// that always began at the top would verify the same few hundred forever;
// started somewhere else each run, the verdicts accumulate across runs
// (applyVerdicts keeps the ones an unprobed item earned earlier).
export async function probeItems(
  itemBase,
  names,
  { answer = fetchAnswer, wait = sleep, start = Math.floor(Math.random() * Math.max(names.length, 1)) } = {},
) {
  const verdicts = new Map();
  const unprobed = [];
  let throttled = false;
  let giveUps = 0;
  const rotated = [...names.slice(start), ...names.slice(0, start)];
  await mapPool(
    rotated,
    async (name) => {
      if (throttled) {
        unprobed.push(name);
        return;
      }
      const url = `${itemBase}/${name}.json`;
      for (let attempt = 1; attempt <= ITEM_PROBE_ATTEMPTS; attempt++) {
        const answered = await answer(url);
        if (!isTransient(answered.status)) {
          const verdict = verdictFor(answered);
          if (verdict) verdicts.set(name, verdict);
          return;
        }
        if (answered.status === 429 && (answered.retryAfterMs ?? 0) > ITEM_PROBE_MAX_WAIT_MS) {
          throttled = true;
          break;
        }
        if (attempt < ITEM_PROBE_ATTEMPTS) {
          const backoff = answered.status === 429 ? 5_000 * attempt : 1_000 * attempt;
          await wait(Math.min(answered.retryAfterMs ?? backoff, ITEM_PROBE_MAX_WAIT_MS));
        } else if (answered.status === 429 && ++giveUps >= ITEM_PROBE_THROTTLE_GIVEUPS) {
          throttled = true;
        }
      }
      // Still transient after the retries, or the answer that ended the probe:
      // no verdict, the item stays listed. It was asked, so it is not counted
      // as unprobed — that number means "never asked", not "asked and unsure".
    },
    ITEM_PROBE_CONCURRENCY,
  );
  return { verdicts, unprobed };
}

// Writes the probe's verdicts onto the items. A fresh verdict replaces
// whatever the item carried, and a fresh answer with no verdict clears it.
// An item the origin never got asked keeps what it earned in an earlier run
// — the same reasoning as a reused view: yesterday's answer beats no answer,
// and the next run that reaches the item corrects it — and is marked
// "unverified" when there is nothing to keep. /r lists only unmarked items,
// so a throttled origin is listed exactly as far as it has been verified,
// and the set of unverified items only shrinks from run to run. `previous`
// is the view on disk from the last run, or null. Exported for the tests.
export function applyVerdicts(items, { verdicts, unprobed }, previous) {
  const carried = new Map(
    (previous?.items ?? [])
      .filter((item) => item.resolution)
      .map((item) => [item.name, item.resolution]),
  );
  const skipped = new Set(unprobed);
  return items.map((item) => {
    const resolution =
      verdicts.get(item.name) ??
      (skipped.has(item.name) ? (carried.get(item.name) ?? "unverified") : undefined);
    // Overwriting in place keeps the slot slimItem reserved next to `type`;
    // an item the origin served must not carry the key at all.
    if (resolution) return { ...item, resolution };
    const { resolution: _served, ...rest } = item;
    return rest;
  });
}

// How many of a view's items carry each resolution — the numbers the
// manifest records and the guard checks against the file.
export function countResolutions(items) {
  const counts = { gated: 0, gone: 0, unverified: 0 };
  for (const item of items) {
    if (item.resolution in counts) counts[item.resolution] += 1;
  }
  return counts;
}

function describeResolutions({ gated, gone, unverified }) {
  const parts = [];
  if (gated > 0) parts.push(`${gated} gated`);
  if (gone > 0) parts.push(`${gone} gone`);
  if (unverified > 0) parts.push(`${unverified} unverified, origin throttled`);
  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
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

// A definitive answer is an answer, and the manifest records it either way.
// Only "wait" (429), server faults (5xx) and network errors earn a second
// chance; DEFINITIVE_ERROR (scripts/lib/data-io.mjs) names the rest.
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
async function failedRead(entry, key, url, error, label, probe) {
  const previous = await readJsonFile(viewPath(key));

  // A reusable view is one that describes the same registry this entry now
  // names. If the directory has since been renamed or repointed, the old file
  // holds a different registry's catalog under a matching key — serving it
  // would answer today's URL with yesterday's origin.
  const sameRegistry =
    previous && previous.entry === entry.name && previous.indexUrl === url;

  if (previous && !sameRegistry) {
    // Deleted, not merely ignored. A "missing" record and a file on disk are
    // contradictory claims about the same registry, and the guard rejects the
    // pair; leaving the file would also keep the key alive through the orphan
    // prune, so nothing would ever clear it.
    const { unlink } = await import("node:fs/promises");
    // Only a file that is already gone is an acceptable failure. Any other
    // error means the file is still there while the manifest is about to say
    // it is not, and claiming a removal that did not happen is the failure
    // mode this whole layer exists to prevent.
    await unlink(viewPath(key)).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
    console.log(
      `${label(entry)}: ${error} — removed the view on disk, it describes ${previous.entry} at ${previous.indexUrl}`,
    );
  }

  if (sameRegistry) {
    // The catalog is carried forward, the verdicts are not — when the origin
    // answered definitively. An index that moved (404) or turned into a web
    // page usually took its items with it, and a reused view that still lists
    // them as installable would keep /r promising what the origin no longer
    // serves. An origin that asked us to wait, or could not be reached, is
    // left alone: probing a throttled host item by item earns nothing but
    // more 429s, and yesterday's verdicts are the best information there is.
    let items = previous.items;
    if (probe && previous.resolvable && DEFINITIVE_ERROR.test(error)) {
      const probed = await probeItems(
        previous.itemBase,
        items.map((i) => i.name),
      );
      items = applyVerdicts(items, probed, previous);
      await writeJsonFile(viewPath(key), { ...previous, items });
    }
    const resolutions = countResolutions(items);
    console.log(
      `${label(entry)}: ${error} — reused (${items.length} items${describeResolutions(resolutions)})`,
    );
    return {
      key,
      entry,
      name: entry.name,
      url,
      items: items.length,
      status: "reused",
      error,
      resolvable: previous.resolvable,
      ...resolutions,
      ...(previous.embedsContent ? { embedsContent: true } : {}),
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

  if (!previous) console.log(`${label(entry)}: ${error} — no previous view to reuse`);
  return { key, entry, name: entry.name, url, items: 0, status: "missing", error };
}

async function indexOne(entry, probe, label, attempts) {
  const key = registryKey(entry);
  const url = indexUrl(entry);
  const result = await fetchWithRetries(url, attempts ? { attempts } : {});

  if (!result.json) {
    return failedRead(entry, key, url, result.error, label, probe);
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
      return failedRead(entry, key, url, paged.error, label, probe);
    }
    index = paged.index;
  } else {
    // A single response can also be short of what it declares. Saying "no
    // more" while handing over fewer rows than `total` is the same shortfall
    // as a dropped page, and it never reaches the paging walk.
    const declared = index.pagination?.total;
    const served = index.items?.length ?? 0;
    if (typeof declared === "number" && served !== declared) {
      return failedRead(
        entry,
        key,
        url,
        `index served ${served} rows and declared ${declared}`,
        label,
        probe,
      );
    }
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

  const names = rawItems.map((item) => item.name);
  const candidates = itemBaseCandidates(entry);

  // Provenance: some registries inline source in their index. Recording it
  // keeps the reason a view holds no file content visible in the manifest.
  const embedsContent = rawItems.some((item) => item.files?.[0]?.content);
  const { itemBase: base, resolvable } = probe
    ? await resolveItemBase(candidates, names)
    : { itemBase: candidates[0], resolvable: true };
  if (base !== candidates[0]) {
    console.log(`  ${entry.name}: items resolve at ${base}, not next to the index`);
  }

  // Item by item, only where the sample said the origin serves something: a
  // fully gated registry is already out of /r, and asking it a thousand more
  // times would only confirm the sample.
  const probed =
    probe && resolvable
      ? await probeItems(base, names)
      : { verdicts: new Map(), unprobed: [] };
  // Earlier verdicts are carried only for items this run could not ask, and
  // only from a view of the same registry: a renamed or repointed entry must
  // not inherit another origin's paywall.
  const previous = await readJsonFile(viewPath(key));
  const sameRegistry = previous && previous.entry === entry.name && previous.indexUrl === url;
  const items = applyVerdicts(rawItems.map(slimItem), probed, sameRegistry ? previous : null);
  const resolutions = countResolutions(items);

  const view = {
    key,
    entry: entry.name,
    name: index.name || entry.name,
    homepage: index.homepage || entry.url,
    indexUrl: url,
    itemBase: base,
    resolvable,
    ...(embedsContent ? { embedsContent: true } : {}),
    items,
  };

  const changed = await writeJsonFile(viewPath(key), view);
  console.log(
    `${label(entry)}: ${items.length} items${resolvable ? describeResolutions(resolutions) : " (origin does not resolve)"}${changed ? "" : " (unchanged)"}`,
  );

  return {
    key,
    entry,
    name: entry.name,
    url,
    items: items.length,
    status: "ok",
    resolvable,
    ...resolutions,
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
  if (!process.env.BLOB_STORE_ID) {
    console.log("snapshot: BLOB_STORE_ID missing — skipped");
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
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
    console.log(
      `snapshot ${date}: archived ${(body.length / 1024).toFixed(0)} KB → ${blob.pathname}`,
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
