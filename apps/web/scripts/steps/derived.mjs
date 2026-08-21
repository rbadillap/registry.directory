// Step 3 of the indexer: the two derived surfaces.
//
//   data/collections.json — the home's curated groupings. A collection is a
//     query; each one carries the criterion it was formed by, and the UI is
//     meant to render that criterion verbatim.
//   data/shipped.json — the "what's new" ticker: a rolling-window diff over
//     the snapshot history archived in Vercel Blob.
//
// Ported from the generate.mjs on branch data/generate. One input changed:
// collections are now computed from the same data/registries/*.json views the
// site renders, not from the blob snapshot, so a collection can never
// disagree with the registry page it links to. shipped still reads the blob,
// because a diff needs history and only the blob has it (read-only — the
// indexer never rewrites a snapshot).
//
// Usage, standalone, from apps/web:
//   node --env-file=.env.local scripts/steps/derived.mjs

import { join } from "node:path";
import { list } from "@vercel/blob";
import {
  DATA_DIR,
  REGISTRIES_DIR,
  WEB_DIR,
  loadDirectory,
  readJsonFile,
  registryKey,
  writeJsonFile,
} from "../lib/data-io.mjs";


function href(entry) {
  const m = entry.github_url?.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (m) return `/${m[1]}/${m[2].replace(/\.git$/, "")}`;
  if (entry.namespace) return `/${entry.namespace.replace(/^@/, "")}`;
  return null;
}

function relativeUpdated(days) {
  if (days === undefined) return undefined;
  if (days < 1) return "updated today";
  if (days < 30) return `updated ${days}d ago`;
  if (days < 365) return `updated ${Math.floor(days / 30)}mo ago`;
  return `updated ${Math.floor(days / 365)}y ago`;
}

// --- registry profiles, from the local views ---------------------------------

function buildProfiles(views, directory, ghStats, affiliateUrls) {
  const profiles = new Map();
  for (const entry of directory) {
    const view = views.get(entry.name);
    if (!view?.items?.length) continue;

    const depCounts = {};
    const byType = {};
    for (const item of view.items) {
      if (item.type) byType[item.type] = (byType[item.type] ?? 0) + 1;
      for (const dep of item.dependencies ?? []) {
        depCounts[dep] = (depCounts[dep] ?? 0) + 1;
      }
    }

    const gh = entry.github_url ? ghStats[entry.github_url] : undefined;
    const updatedDays = gh?.lastCommit
      ? Math.floor((Date.now() - new Date(gh.lastCommit).getTime()) / 86400000)
      : undefined;

    profiles.set(entry.name, {
      entry,
      itemCount: view.items.length,
      depCounts,
      byType,
      stars: gh?.stars,
      updatedDays,
      sponsored: affiliateUrls.has(entry.url) || undefined,
    });
  }
  return profiles;
}

function card(profile, evidence) {
  const { entry } = profile;
  const h = href(entry);
  if (!h) return null;
  // The two commonest types and the offerings, as the schema names them.
  // Turning either into words is the interface's job: it already owns that
  // vocabulary, and a second copy here drifts from it without anyone noticing.
  const types = Object.entries(profile.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t);
  const proFlags = Object.entries(entry.pro ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => k);
  return {
    name: entry.name,
    href: h,
    avatar: entry.github_profile || undefined,
    description: entry.description,
    itemCount: profile.itemCount || undefined,
    types,
    stars: profile.stars,
    updated: relativeUpdated(profile.updatedDays),
    updatedDays: profile.updatedDays,
    pro: proFlags.length ? proFlags : undefined,
    sponsored: profile.sponsored,
    evidence,
  };
}

// --- collections: each one is a query ----------------------------------------

function depSum(profile, pkgs) {
  return pkgs.reduce((s, p) => s + (profile.depCounts[p] ?? 0), 0);
}

// One package, not two. Two clauses wrap to a second line of small uppercase
// text on a desktop card and to three on a phone, and the second package
// never changed anyone's mind about the first.
function depEvidence(profile, pkgs, max = 1) {
  return pkgs
    .map((p) => [p, profile.depCounts[p] ?? 0])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([p, n]) => `${n} components import ${p}`)
    .join(" · ");
}

function topByDeps(profiles, pkgs, take, minMentions = 10) {
  return [...profiles.values()]
    .filter((p) => depSum(p, pkgs) >= minMentions && href(p.entry))
    .sort((a, b) => depSum(b, pkgs) - depSum(a, pkgs))
    .slice(0, take)
    .map((p) => card(p, depEvidence(p, pkgs)))
    .filter(Boolean);
}

const MOTION_PKGS = ["motion", "framer-motion", "gsap"];
const DASH_PKGS = ["recharts", "@tanstack/react-table", "d3"];
const ALT_PRIMITIVE_PKGS = [
  "@base-ui/react",
  "@base-ui-components/react",
  "react-aria-components",
  "react-aria",
];
const AGENT_REGEX = /\b(ai|agents?|assistants?|llm)\b/i;
const CURATED_SHELF = [
  ["termcn", "TUI components — renders in the terminal, not the browser"],
  ["8bitcn", "the whole design system is 8-bit"],
  ["RetroUI", "neobrutalism as a component library"],
  ["pqoqubbw/icons", "icons that move — every glyph is choreographed"],
  ["heroicons-animated", "heroicons, but alive"],
];

function buildCollections(profiles) {
  const collections = [
    {
      slug: "motion",
      title: "Movement as a first language",
      standfirst:
        "These registries build animation into their components.",
      kind: "computed",
      registries: topByDeps(profiles, MOTION_PKGS, 5),
    },
    {
      slug: "agent-ui",
      title: "Interfaces for agents",
      standfirst:
        "Components for chat, streaming text and tool calls.",
      kind: "computed",
      registries: [...profiles.values()]
        .filter((p) => AGENT_REGEX.test(`${p.entry.name} ${p.entry.description}`))
        .map((p) => ({ p, inName: AGENT_REGEX.test(p.entry.name) }))
        .sort((a, b) =>
          a.inName === b.inName ? b.p.itemCount - a.p.itemCount : a.inName ? -1 : 1
        )
        .slice(0, 5)
        .map(({ p, inName }) => {
          const m = `${p.entry.name} ${p.entry.description}`.match(AGENT_REGEX);
          return card(p, `Describes itself as "${m?.[0]?.toLowerCase()}"`);
        })
        .filter(Boolean),
    },
    {
      slug: "dashboards",
      title: "Built for dashboards",
      standfirst:
        "Components for charts, tables and the screens that show data.",
      kind: "computed",
      registries: topByDeps(profiles, DASH_PKGS, 5),
    },
    {
      slug: "beyond-radix",
      title: "Beyond Radix",
      standfirst:
        "These registries build on Base UI or React Aria, not on Radix.",
      kind: "computed",
      registries: topByDeps(profiles, ALT_PRIMITIVE_PKGS, 5, 5),
    },
    {
      slug: "megacatalogs",
      title: "The megacatalogs",
      standfirst:
        "Each of these registries has +1000 components.",
      kind: "computed",
      registries: [...profiles.values()]
        .filter((p) => p.itemCount >= 1000 && href(p.entry))
        .sort((a, b) => b.itemCount - a.itemCount)
        .slice(0, 5)
        .map((p) =>
          // The card already lists the types; the evidence is the size.
          card(p, `${p.itemCount.toLocaleString("en-US")} components`)
        )
        .filter(Boolean),
    },
    {
      slug: "sells-real",
      title: "Sells something real",
      standfirst:
        "These registries sell templates, Figma kits, MCP servers and team licences.",
      kind: "computed",
      registries: [...profiles.values()]
        .filter(
          (p) => Object.values(p.entry.pro ?? {}).some((v) => v === true) && href(p.entry)
        )
        .sort(
          (a, b) =>
            Object.values(b.entry.pro ?? {}).filter(Boolean).length -
            Object.values(a.entry.pro ?? {}).filter(Boolean).length
        )
        .slice(0, 5)
        .map((p) => card(p, undefined))
        .filter(Boolean),
    },
    {
      slug: "weird-wonderful",
      title: "Unique by design",
      standfirst:
        "A look you will not find in another registry.",
      kind: "curated",
      registries: CURATED_SHELF.map(([name, reason]) => {
        const p = profiles.get(name);
        return p ? card(p, reason) : null;
      }).filter(Boolean),
    },
  ];

  // A collection thinner than 4 members is a filter result, not a group.
  return collections.filter((c) => c.registries.length >= 4);
}

// --- shipped: rolling-window diff over the snapshot history ------------------
//
// A 24h diff is honest but thin — the ecosystem ships ~2 registries per
// window. shipped.json therefore covers a rolling GRACE_DAYS window,
// recomputed statelessly from the retained snapshots: each snapshot inside
// the window diffs every registry against its most recent PRIOR appearance,
// so a registry that failed ingestion one day contributes its additions the
// day it reappears instead of losing them in the gap.

const GRACE_DAYS = 7;

// Enough entries for the wall to close its grid even on a quiet window.
const MIN_ENTRIES = 12;

function daysBetween(a, b) {
  return Math.round((new Date(`${a}T00:00Z`) - new Date(`${b}T00:00Z`)) / 86400000);
}

function buildShipped(snapshots, directory) {
  const byName = new Map(directory.map((d) => [d.name, d]));
  const current = snapshots[snapshots.length - 1];
  let entries = [];

  // The window decides what counts as recent. The wall below it needs a
  // steady number of entries whatever the window holds, so once the window is
  // spent the walk keeps going into older snapshots — those entries carry
  // their own older dates, and are recent for nobody.
  const inWindow = snapshots.filter((s) => daysBetween(current.date, s.date) < GRACE_DAYS);
  const older = snapshots.filter((s) => !inWindow.includes(s));
  const walk = [...inWindow].reverse().concat([...older].reverse());

  for (const snap of walk) {
    if (entries.length >= MIN_ENTRIES && daysBetween(current.date, snap.date) >= GRACE_DAYS) break;
    const before = snapshots.filter((s) => s.date < snap.date);
    for (const [name, raw] of Object.entries(snap.registries)) {
      if (!raw?.items) continue;
      const prior = [...before].reverse().find((s) => s.registries[name]?.items);
      if (!prior) continue; // first appearance — a whole catalog is not news
      const old = new Set(prior.registries[name].items.map((i) => i.name));
      const added = raw.items.map((i) => i.name).filter((n) => !old.has(n));
      if (added.length === 0) continue;
      // The link travels with the entry. Looking it up in the collections
      // made a registry's page reachable only while it belonged to one.
      const directoryEntry = byName.get(name);
      entries.push({
        date: snap.date,
        since: prior.date,
        registry: name,
        avatar: directoryEntry?.github_profile ?? null,
        href: directoryEntry ? href(directoryEntry) : null,
        added,
      });
    }
  }

  // One row per registry. Within a week, a registry that published on two
  // days is one piece of news, not two: the additions join, the date is the
  // most recent of them, and `since` reaches back to the earliest comparison
  // the merged row now stands for.
  const merged = new Map();
  for (const entry of entries) {
    const seen = merged.get(entry.registry);
    if (!seen) {
      merged.set(entry.registry, { ...entry, added: [...entry.added] });
      continue;
    }
    for (const name of entry.added) {
      if (!seen.added.includes(name)) seen.added.push(name);
    }
    if (entry.date > seen.date) seen.date = entry.date;
    if (entry.since < seen.since) seen.since = entry.since;
  }

  entries = [...merged.values()];
  entries.sort((a, b) => b.date.localeCompare(a.date) || b.added.length - a.added.length);

  return {
    date: current.date,
    windowDays: GRACE_DAYS,
    ...(entries.length === 0 && snapshots.length < 2
      ? { note: "first snapshot — the diff starts with the next ingestion run" }
      : {}),
    entries,
  };
}

async function loadSnapshots() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];

  const { blobs } = await list({ prefix: "snapshots/" });
  const dated = blobs
    .filter((b) => /snapshots\/\d{4}-\d{2}-\d{2}\.json$/.test(b.pathname))
    .sort((a, b) => a.pathname.localeCompare(b.pathname))
    // Enough history to cover the grace window plus prior appearances for
    // registries that flap in and out of ingestion.
    .slice(-8);

  const snapshots = [];
  for (const blob of dated) {
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) continue;
    snapshots.push(await res.json());
  }
  return snapshots.sort((a, b) => a.date.localeCompare(b.date));
}

export async function indexDerived(views) {
  const directory = await loadDirectory();

  // Views come from the caller during a full run; standalone we reload them.
  const loaded =
    views ??
    new Map(
      (
        await Promise.all(
          directory.map(async (entry) => [
            entry.name,
            await readJsonFile(join(REGISTRIES_DIR, `${registryKey(entry)}.json`)),
          ])
        )
      ).filter(([, view]) => view)
    );

  const ghStats = (await readJsonFile(join(DATA_DIR, "github.json"))) ?? {};
  const affiliatesFile = await readJsonFile(join(WEB_DIR, "public/affiliates.json"));
  const affiliateUrls = new Set((affiliatesFile?.affiliates ?? []).map((a) => a.url));

  const profiles = buildProfiles(loaded, directory, ghStats, affiliateUrls);

  const collections = {
    meta: {
      registries: profiles.size,
      totalItems: [...profiles.values()].reduce((s, p) => s + p.itemCount, 0),
    },
    collections: buildCollections(profiles),
  };
  await writeJsonFile(join(DATA_DIR, "collections.json"), collections);
  console.log(
    `collections: ${collections.collections.length} — ${collections.collections
      .map((c) => `${c.slug}(${c.registries.length})`)
      .join(", ")}`
  );

  const snapshots = await loadSnapshots();
  if (snapshots.length === 0) {
    console.log("shipped: no snapshots readable — left the existing file untouched");
    return { collections: collections.collections.length, shipped: null };
  }

  const shipped = buildShipped(snapshots, directory);
  await writeJsonFile(join(DATA_DIR, "shipped.json"), shipped);
  console.log(
    `shipped: ${shipped.entries.length} entries over ${snapshots.length} snapshots (window ${shipped.windowDays}d)`
  );

  return { collections: collections.collections.length, shipped: shipped.entries.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await indexDerived();
}
