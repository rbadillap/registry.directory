// Where each item can be seen working: the page its author already publishes
// for it, found in the author's own sitemap.xml.
//
// People asked to see a component before choosing it. Almost every author
// already shows theirs, live and with real props, on a page of their site;
// what the directory lacked was the exact link. This step reads each
// registry's sitemap once a week and pairs an item with the one URL whose
// last segment is its name.
//
// It only ever parses XML. Nothing it downloads is run, rendered or stored
// beyond the URLs it keeps.
//
// The rules are global, never per registry. A rule that only holds for one
// author is a rule nobody will remember to revisit when that author changes
// their site; a global rule fails loudly in the precision check instead.

import { join } from "node:path";
import {
  DATA_DIR,
  REGISTRIES_DIR,
  USER_AGENT,
  mapPool,
  readJsonFile,
  registryKey,
  today,
  writeJsonFile,
} from "../lib/data-io.mjs";

export const DEMOS_PATH = join(DATA_DIR, "demos.json");

// Once a week is enough: a demo page moves far less often than a catalog.
export const DEMOS_MAX_AGE_DAYS = 7;

// Every registry is read the same way: one sitemap a week, at most four
// requests, never retried. Origins that throttle the indexer do so on the
// item probe, which asks for thousands of files; this asks for one.

// A path must name a place where components are shown, and must not name a
// place where they are only written about.
const PATH_ALLOW = /\/(components?|blocks?|docs|icons|ui|elements|primitives|library|objects)\//;
const PATH_DENY = /\/(changelog|blog|api-reference|guides)\//;

// One sitemap, plus at most three of the sitemaps an index points to.
const MAX_CHILD_SITEMAPS = 3;
const MAX_SITEMAP_BYTES = 8_000_000;
const FETCH_TIMEOUT_MS = 20_000;

// A run that finds less than half of last week's links found a broken
// sitemap, not a site that lost half its pages overnight.
const MAX_DROP = 0.5;

/** The host as people mean it: www. is the same site. */
export function siteHost(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Every <loc> in a sitemap or sitemap index. */
export function parseLocs(xml) {
  const locs = [];
  for (const match of xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\s\]]+)\s*(?:\]\]>)?\s*<\/loc>/g)) {
    locs.push(match[1].replace(/&amp;/g, "&"));
  }
  return locs;
}

export function isSitemapIndex(xml) {
  return /<sitemapindex[\s>]/.test(xml);
}

/**
 * Pairs items with demo URLs.
 *
 * A URL qualifies when it lives on one of the registry's own hosts, under an allowed
 * path and not a denied one. Its last segment is the name it answers to. A
 * name that two URLs answer to is ambiguous — shadcn's radix, aria and base
 * variants of one component, say — and is dropped rather than guessed.
 */
export function matchDemos(items, urls, hosts) {
  const bySegment = new Map();
  for (const raw of urls) {
    let url;
    try {
      url = new URL(raw);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    if (!hosts.has(url.hostname.toLowerCase().replace(/^www\./, ""))) continue;
    const path = url.pathname.replace(/\/+$/, "");
    if (!path) continue;
    const probe = `${path.toLowerCase()}/`;
    if (!PATH_ALLOW.test(probe) || PATH_DENY.test(probe)) continue;
    let segment;
    try {
      segment = decodeURIComponent(path.split("/").pop()).toLowerCase();
    } catch {
      continue;
    }
    url.hash = "";
    const set = bySegment.get(segment) ?? new Set();
    set.add(url.toString());
    bySegment.set(segment, set);
  }

  const demos = {};
  const groups = [];
  let ambiguous = 0;
  for (const item of items) {
    if (item.resolution === "gone") continue;
    // The first key that names exactly one page wins; one that names two
    // stops the search, since a weaker key would only guess between them.
    for (const [kind, key] of candidateKeys(item)) {
      const found = bySegment.get(key);
      if (!found) continue;
      if (found.size > 1) {
        ambiguous++;
        break;
      }
      demos[item.name] = [...found][0];
      if (kind === "group") groups.push(item.name);
      break;
    }
  }
  return { demos, groups, ambiguous };
}

const VARIANT_SUFFIX = /-(demo|example|examples|preview|default|basic|showcase)$/;
const NUMBER_SUFFIX = /-\d+$/;

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * The names an item's page could be published under, strongest first:
 *
 * - exact: the item's name (voice-orb → /components/voice-orb);
 * - title: the title its author gave it, as a slug (\"Hero Section 1\" →
 *   /blocks/hero-section-1), for authors whose pages follow the title;
 * - variant: the name without a demo/example suffix (bg-animate-button-demo
 *   → /docs/components/bg-animate-button), the page that shows the demo;
 * - group: the name without a trailing number (accordion-01 → /accordion),
 *   the page that shows a numbered set of variants together. It lands on
 *   the group, not on the variant, and is recorded as such.
 */
export function candidateKeys(item) {
  const name = item.name.toLowerCase();
  const keys = [["exact", name]];
  if (item.title) keys.push(["title", slugify(item.title)]);
  keys.push(["variant", name.replace(VARIANT_SUFFIX, "")]);
  keys.push(["group", name.replace(NUMBER_SUFFIX, "")]);
  const seen = new Set();
  return keys.filter(([kind, key]) => {
    if (!key || seen.has(key) || (kind !== "exact" && key === name)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * This run's map, or last week's when this one is not to be trusted.
 * Previous links are kept only for items the view still lists.
 */
export function settle(next, previous, items) {
  const listed = new Set(items.filter((i) => i.resolution !== "gone").map((i) => i.name));
  const carried = previous?.demos
    ? Object.fromEntries(Object.entries(previous.demos).filter(([name]) => listed.has(name)))
    : null;
  const carriedGroups = (previous?.groups ?? []).filter((name) => carried && name in carried);
  const carriedCount = carried ? Object.keys(carried).length : 0;

  if (next.error) {
    if (carriedCount > 0) {
      return { status: "reused", reason: next.error, demos: carried, groups: carriedGroups };
    }
    return { status: "missing", reason: next.error, demos: {}, groups: [] };
  }

  const count = Object.keys(next.demos).length;
  if (carriedCount > 0 && count < carriedCount * (1 - MAX_DROP)) {
    return {
      status: "reused",
      reason: `matches fell from ${carriedCount} to ${count}`,
      demos: carried,
      groups: carriedGroups,
    };
  }
  return { status: "ok", demos: next.demos, groups: next.groups ?? [] };
}

async function fetchText(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "user-agent": USER_AGENT, accept: "application/xml,text/xml;q=0.9,*/*;q=0.1" },
      redirect: "follow",
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const length = Number(res.headers.get("content-length") ?? 0);
    if (length > MAX_SITEMAP_BYTES) return { error: "sitemap too large" };
    const text = await res.text();
    if (text.length > MAX_SITEMAP_BYTES) return { error: "sitemap too large" };
    return { text, finalUrl: res.url || url };
  } catch (error) {
    return { error: error?.message?.slice(0, 80) ?? "fetch failed" };
  }
}

// Child sitemaps that name a component-ish path go first: in an index of
// pages, posts and docs, the docs are the ones worth one of three requests.
function pickChildren(locs, hosts) {
  const own = locs.filter((loc) => hosts.has(siteHost(loc)));
  // The path, not the whole URL: a host like ui.example.com names nothing.
  const wanted = (loc) =>
    /(component|block|doc|icon|ui|element|primitive|library|object)/i.test(new URL(loc).pathname);
  return [...own.filter(wanted), ...own.filter((loc) => !wanted(loc))].slice(0, MAX_CHILD_SITEMAPS);
}

/**
 * 1 to 4 requests: the sitemap, and up to three children if it is an index.
 *
 * The registry's own hosts are its homepage's, plus the ones its own
 * sitemap.xml names, from the host the directory lists:
 *
 * - the host it redirects to, for a site that moved (retroui.dev to
 *   neobrutalism.com);
 * - the hosts of the sitemaps it lists, when it is an index (ui.beste.co's
 *   points to beste.dev's). Only a sitemap index declares hosts; a page
 *   listed in an ordinary sitemap does not.
 */
export async function readSitemap(homepage, get = fetchText) {
  const origin = new URL(homepage).origin;
  const first = await get(`${origin}/sitemap.xml`);
  let requests = 1;
  if (first.error) return { error: `sitemap.xml ${first.error}`, requests };
  const homeHost = siteHost(homepage);
  const hosts = new Set([homeHost]);
  const redirectedTo = first.finalUrl ? siteHost(first.finalUrl) : null;
  if (redirectedTo) hosts.add(redirectedTo);
  // The hosts beyond the homepage's, recorded so the site can check its
  // links against the same set.
  const own = () => {
    const extra = [...hosts].filter((host) => host && host !== homeHost).sort();
    return extra.length ? { ownHosts: extra } : {};
  };
  if (!/<(urlset|sitemapindex)[\s>]/.test(first.text)) {
    return { error: "sitemap.xml is not a sitemap", requests };
  }
  if (!isSitemapIndex(first.text)) {
    return { urls: parseLocs(first.text), hosts, requests, ...own() };
  }

  const children = parseLocs(first.text);
  for (const child of children) {
    const host = siteHost(child);
    if (host) hosts.add(host);
  }

  const urls = [];
  let read = 0;
  for (const child of pickChildren(children, hosts)) {
    const page = await get(child);
    requests++;
    if (page.error) continue;
    read++;
    urls.push(...parseLocs(page.text));
  }
  if (read === 0) return { error: "no child sitemap could be read", requests };
  return { urls, hosts, requests, ...own() };
}

function ageInDays(isoDate) {
  if (!isoDate) return Infinity;
  return (Date.now() - Date.parse(isoDate)) / 86_400_000;
}

/**
 * Builds data/demos.json.
 *
 * Runs when the map is a week old, or when asked (`--demos`). A partial run
 * (`--only`) refreshes just those registries, and only with --demos.
 */
export async function indexDemos({ directory, force = false, only = null } = {}) {
  const prior = await readJsonFile(DEMOS_PATH);
  const age = ageInDays(prior?.generatedAt);
  // A partial run is about a few views; it refreshes their links only when
  // asked, and never moves the weekly clock for the registries it skipped.
  if (only && !force) {
    console.log("demos: skipped on a partial run (pass --demos to refresh these)");
    return { skipped: true, registries: prior?.registries ?? {} };
  }
  if (!force && age < DEMOS_MAX_AGE_DAYS) {
    console.log(
      `demos: skipped, the map is ${age.toFixed(1)} day(s) old (weekly; pass --demos to refresh now)`
    );
    return { skipped: true, registries: prior?.registries ?? {} };
  }

  const entries = directory.filter((entry) => !only || only.has(registryKey(entry)));

  const results = await mapPool(entries, async (entry) => {
    const key = registryKey(entry);
    const previous = prior?.registries?.[key] ?? null;
    const view = await readJsonFile(join(REGISTRIES_DIR, `${key}.json`));
    const host = siteHost(entry.url);

    if (!view?.items) {
      return [key, { status: "missing", reason: "no view on disk", checkedAt: today(), requests: 0, demos: {} }];
    }
    if (!host || host === "github.com") {
      return [key, { status: "skipped", reason: "no site of its own", checkedAt: today(), requests: 0, demos: {} }];
    }

    const sitemap = await readSitemap(entry.url);
    const next = sitemap.error
      ? { error: sitemap.error }
      : matchDemos(view.items, sitemap.urls, sitemap.hosts);
    const settled = settle(next, previous, view.items);
    return [
      key,
      {
        status: settled.status,
        ...(settled.reason ? { reason: settled.reason } : {}),
        checkedAt: today(),
        requests: sitemap.requests,
        // The hosts beyond the homepage's that its own sitemap named, by
        // redirect or by index. The site checks links against them too.
        ...(sitemap.ownHosts ? { ownHosts: sitemap.ownHosts } : {}),
        ...(next.ambiguous ? { ambiguous: next.ambiguous } : {}),
        demos: sortKeys(settled.demos),
        // Items whose link lands on the page of their numbered group rather
        // than on a page of their own. Absent when none.
        ...(settled.groups.length ? { groups: [...settled.groups].sort() } : {}),
      },
    ];
  }, 4);

  const registries = { ...(only ? prior?.registries ?? {} : {}) };
  for (const [key, record] of results) registries[key] = record;

  // Registries that left the directory leave the map with it.
  const keys = new Set(directory.map(registryKey));
  for (const key of Object.keys(registries)) if (!keys.has(key)) delete registries[key];

  await writeJsonFile(DEMOS_PATH, {
    generatedAt: only && prior?.generatedAt ? prior.generatedAt : new Date().toISOString(),
    registries: sortKeys(registries),
  });

  const all = Object.values(registries);
  const linked = all.reduce((sum, r) => sum + Object.keys(r.demos).length, 0);
  const requests = results.reduce((sum, [, r]) => sum + r.requests, 0);
  const by = (status) => all.filter((r) => r.status === status).length;
  console.log(
    `demos: ${linked.toLocaleString("en-US")} item(s) linked · ok ${by("ok")} · reused ${by("reused")} · missing ${by("missing")} · skipped ${by("skipped")} · ${requests} request(s)`
  );
  const reused = results.filter(([, r]) => r.status === "reused");
  if (reused.length > 0) {
    console.log(`demos reused: ${reused.map(([key, r]) => `${key} (${r.reason})`).join(", ")}`);
  }
  return { skipped: false, registries };
}

function sortKeys(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
}
