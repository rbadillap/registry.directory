// Generates the surface files from the snapshots that ingest.mjs persists —
// one blob per consuming surface: collections.json for the home's
// groupings, shipped.json for the novedades ticker. Runs on the maintainer's
// machine right after ingest.mjs; Vercel only ever reads the results.
//
// Usage, from apps/web:
//   node --env-file=.env.local scripts/generate.mjs
//
// A collection is a query. Each one carries the criterion it was formed by,
// and the UI renders that criterion verbatim — computed groups name their
// formula, the curated group names its curator.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { list, put } from "@vercel/blob";

// --- shared helpers ---------------------------------------------------------

const TYPE_LABELS = {
  "registry:block": "blocks",
  "registry:ui": "ui",
  "registry:component": "components",
  "registry:hook": "hooks",
  "registry:lib": "lib",
  "registry:theme": "themes",
  "registry:style": "styles",
  "registry:page": "pages",
  "registry:file": "files",
  "registry:item": "items",
};

const PRO_CHIP_LABELS = {
  pro_blocks: "pro blocks",
  templates: "templates",
  figma_kit: "figma",
  mcp_agent: "mcp",
  team_license: "team",
};

function blobBaseUrl() {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? "";
  const match = token.match(/vercel_blob_rw_([^_]+)_/);
  if (!match) throw new Error("BLOB_READ_WRITE_TOKEN missing or malformed");
  return `https://${match[1]}.public.blob.vercel-storage.com`;
}

async function readJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return res.json();
}

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

// --- registry profiles from the snapshot -------------------------------------

function buildProfiles(snapshot, directory, ghStats, affiliateUrls) {
  const profiles = new Map();
  for (const entry of directory) {
    const raw = snapshot.registries[entry.name];
    if (!raw?.items) continue;
    const depCounts = {};
    const byType = {};
    for (const item of raw.items) {
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
      itemCount: raw.items.length,
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
  const types = Object.entries(profile.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => TYPE_LABELS[t] ?? t.replace("registry:", ""));
  const proFlags = Object.entries(entry.pro ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => PRO_CHIP_LABELS[k] ?? k);
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

function depEvidence(profile, pkgs, max = 2) {
  return pkgs
    .map((p) => [p, profile.depCounts[p] ?? 0])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([p, n]) => `${p}×${n}`)
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
        "Registries where animation is the point, not the garnish — springs, staggers and scroll choreography ship inside the components.",
      criterion: "deps ∩ { motion, framer-motion, gsap } · ranked by mentions",
      kind: "computed",
      registries: topByDeps(profiles, MOTION_PKGS, 5),
    },
    {
      slug: "agent-ui",
      title: "Interfaces for agents",
      standfirst:
        "Chat surfaces, streaming markdown, tool-call rendering — the component layer of the AI application stack. Chat UI rarely imports the AI SDK, so this cluster's identity lives in what the registries say they are.",
      criterion: "name ∨ description ∋ { ai, agent, assistant } · from submission data",
      kind: "computed",
      registries: [...profiles.values()]
        .filter((p) => AGENT_REGEX.test(`${p.entry.name} ${p.entry.description}`))
        .map((p) => ({ p, inName: AGENT_REGEX.test(p.entry.name) }))
        .sort((a, b) =>
          a.inName === b.inName
            ? b.p.itemCount - a.p.itemCount
            : a.inName
              ? -1
              : 1
        )
        .slice(0, 5)
        .map(({ p, inName }) => {
          const m = `${p.entry.name} ${p.entry.description}`.match(AGENT_REGEX);
          return card(p, `"${m?.[0]?.toLowerCase()}" in ${inName ? "name" : "description"}`);
        })
        .filter(Boolean),
    },
    {
      slug: "dashboards",
      title: "Built for dashboards",
      standfirst:
        "Charts, data tables and the plumbing around them — registries that assume your next screen has numbers on it.",
      criterion: "deps ∩ { recharts, tanstack-table, d3 } · ranked by mentions",
      kind: "computed",
      registries: topByDeps(profiles, DASH_PKGS, 5),
    },
    {
      slug: "beyond-radix",
      title: "Beyond Radix",
      standfirst:
        "The ecosystem's default primitive is Radix. These registries bet on Base UI or React Aria instead — a real architectural fork.",
      criterion:
        "deps ∩ { @base-ui/react, react-aria-components } · ranked by mentions",
      kind: "computed",
      registries: topByDeps(profiles, ALT_PRIMITIVE_PKGS, 5, 5),
    },
    {
      slug: "megacatalogs",
      title: "The megacatalogs",
      standfirst:
        "Four-digit item counts. When you need volume and variety more than a single voice.",
      criterion: "items ≥ 1,000 · ranked by item count",
      kind: "computed",
      registries: [...profiles.values()]
        .filter((p) => p.itemCount >= 1000 && href(p.entry))
        .sort((a, b) => b.itemCount - a.itemCount)
        .slice(0, 5)
        .map((p) =>
          card(
            p,
            `${p.itemCount.toLocaleString("en-US")} items · ${
              Object.entries(p.byType).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace("registry:", "") ?? ""
            }`
          )
        )
        .filter(Boolean),
    },
    {
      slug: "sells-real",
      title: "Sells something real",
      standfirst:
        "Commercial registries whose paid tier we verified on the live site — templates, Figma kits, MCP servers, team licenses.",
      criterion: "pro flags verified · from submission data + live-site audit",
      kind: "computed",
      registries: [...profiles.values()]
        .filter(
          (p) =>
            Object.values(p.entry.pro ?? {}).some((v) => v === true) &&
            href(p.entry)
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
      title: "Weird & wonderful",
      standfirst:
        "Hand-picked outliers that stretch what a registry can be. No query produced this shelf — an editor did.",
      criterion: "curated by @rbadillap · no query",
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

// --- shipped: the day-to-day diff --------------------------------------------

function buildShipped(current, previous, directory) {
  const byName = new Map(directory.map((d) => [d.name, d]));
  const entries = [];
  if (!previous) {
    return {
      date: current.date,
      baseline: null,
      note: "first snapshot — the diff starts with the next ingestion run",
      entries,
    };
  }
  for (const [name, raw] of Object.entries(current.registries)) {
    if (!raw?.items) continue;
    const before = previous.registries[name];
    if (!before?.items) continue; // only diff registries present in BOTH
    const old = new Set(before.items.map((i) => i.name));
    const added = raw.items.map((i) => i.name).filter((n) => !old.has(n));
    if (added.length === 0) continue;
    entries.push({
      date: current.date,
      registry: name,
      avatar: byName.get(name)?.github_profile ?? null,
      added,
    });
  }
  entries.sort((a, b) => b.added.length - a.added.length);
  return { date: current.date, baseline: previous.date, entries };
}

// --- main ---------------------------------------------------------------------

async function main() {
  const base = blobBaseUrl();

  // Latest two snapshots, by date in the pathname.
  const { blobs } = await list({ prefix: "snapshots/" });
  const dated = blobs
    .filter((b) => /snapshots\/\d{4}-\d{2}-\d{2}\.json$/.test(b.pathname))
    .sort((a, b) => a.pathname.localeCompare(b.pathname));
  if (dated.length === 0) {
    console.error("no snapshots in blob — run scripts/ingest.mjs first");
    process.exit(1);
  }
  const current = await readJson(dated[dated.length - 1].url);
  const previous =
    dated.length > 1 ? await readJson(dated[dated.length - 2].url) : null;

  const directoryPath = join(process.cwd(), "public/directory.json");
  const { registries: directory } = JSON.parse(
    await readFile(directoryPath, "utf8")
  );

  let ghStats = {};
  try {
    ghStats = await readJson(`${base}/github.json`);
  } catch {
    console.warn("github.json blob unavailable — stars/updated omitted");
  }

  let affiliateUrls = new Set();
  try {
    const aff = JSON.parse(
      await readFile(join(process.cwd(), "public/affiliates.json"), "utf8")
    );
    affiliateUrls = new Set((aff.affiliates ?? []).map((a) => a.url));
  } catch {
    // no affiliates file — nothing to label
  }

  const profiles = buildProfiles(current, directory, ghStats, affiliateUrls);

  const collections = {
    meta: {
      date: current.date,
      indexesOk: current.counts?.ok,
      indexesTotal: current.counts?.registries,
      totalItems: [...profiles.values()].reduce((s, p) => s + p.itemCount, 0),
    },
    collections: buildCollections(profiles),
  };
  const shipped = buildShipped(current, previous, directory);

  const collectionsBlob = await put(
    "collections.json",
    JSON.stringify(collections),
    {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    }
  );
  const shippedBlob = await put("shipped.json", JSON.stringify(shipped), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  console.log(`snapshot ${current.date} (baseline: ${shipped.baseline ?? "none"})`);
  console.log(
    `collections.json: ${collections.collections.length} collections — ${collections.collections
      .map((c) => `${c.slug}(${c.registries.length})`)
      .join(", ")}`
  );
  console.log(`  ${collectionsBlob.url}`);
  console.log(
    `shipped.json: ${shipped.entries.length} entries${shipped.note ? ` — ${shipped.note}` : ""}`
  );
  console.log(`  ${shippedBlob.url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
