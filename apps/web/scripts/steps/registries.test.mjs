// Pagination is the one part of the indexer no registry in the directory
// currently exercises: every origin answers its whole catalog in one response.
// That makes it the easiest place for a regression to live unnoticed, so the
// cases are pinned here with a stub in place of the network.
//
// Run with: pnpm test

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { fetchRemainingPages } from "./registries.mjs";

const URL_UNDER_TEST = "https://example.test/r/registry.json";

// Serves pages keyed by the offset the walk asks for. `total` is what the
// origin claims, counted in rows — an origin may serve the same name twice.
function origin({ total, pages }) {
  return async (url) => {
    const offset = Number(new global.URL(url).searchParams.get("offset"));
    const page = pages.find((p) => p.offset === offset);
    if (!page) return { error: `no page at offset ${offset}` };
    if (page.fail) return { error: page.fail };
    return {
      json: {
        items: page.items,
        pagination: { total, hasMore: page.hasMore },
      },
    };
  };
}

const first = (items, total) => ({
  items,
  pagination: { limit: items.length, total, hasMore: true },
});

describe("fetchRemainingPages", () => {
  it("walks to the end and keeps every item", async () => {
    const result = await fetchRemainingPages(
      URL_UNDER_TEST,
      first([{ name: "a" }], 3),
      origin({
        total: 3,
        pages: [
          { offset: 1, items: [{ name: "b" }], hasMore: true },
          { offset: 2, items: [{ name: "c" }], hasMore: false },
        ],
      })
    );

    assert.equal(result.error, undefined);
    assert.deepEqual(
      result.index.items.map((i) => i.name),
      ["a", "b", "c"]
    );
  });

  it("advances the cursor by rows, not by distinct names", async () => {
    // The origin repeats "a" at offset 1. A cursor counting names would ask
    // for offset 1 again and never reach "c".
    const result = await fetchRemainingPages(
      URL_UNDER_TEST,
      first([{ name: "a" }], 3),
      origin({
        total: 3,
        pages: [
          { offset: 1, items: [{ name: "a" }], hasMore: true },
          { offset: 2, items: [{ name: "c" }], hasMore: false },
        ],
      })
    );

    assert.equal(result.error, undefined);
    assert.deepEqual(
      result.index.items.map((i) => i.name),
      ["a", "c"],
      "the repeat collapses, but the walk still reaches the last page"
    );
  });

  it("fails when a page cannot be fetched", async () => {
    const result = await fetchRemainingPages(
      URL_UNDER_TEST,
      first([{ name: "a" }], 3),
      origin({ total: 3, pages: [{ offset: 1, fail: "HTTP 429" }] })
    );

    assert.match(result.error, /HTTP 429/);
    assert.equal(result.index, undefined);
  });

  it("fails when a page is empty but the origin still claims more", async () => {
    const result = await fetchRemainingPages(
      URL_UNDER_TEST,
      first([{ name: "a" }], 9),
      origin({ total: 9, pages: [{ offset: 1, items: [], hasMore: true }] })
    );

    assert.match(result.error, /stalled/);
  });

  it("fails when the walk ends short of the declared total", async () => {
    const result = await fetchRemainingPages(
      URL_UNDER_TEST,
      first([{ name: "a" }], 5),
      origin({
        total: 5,
        pages: [{ offset: 1, items: [{ name: "b" }], hasMore: false }],
      })
    );

    assert.match(result.error, /consumed 2 rows, origin declared 5/);
  });

  it("counts the declared total in rows, so repeats still satisfy it", async () => {
    // Three rows served, one of them a repeat: two distinct names reach the
    // view, and the origin's count of three is still met.
    const result = await fetchRemainingPages(
      URL_UNDER_TEST,
      first([{ name: "a" }], 3),
      origin({
        total: 3,
        pages: [
          { offset: 1, items: [{ name: "a" }], hasMore: true },
          { offset: 2, items: [{ name: "b" }], hasMore: false },
        ],
      })
    );

    assert.equal(result.error, undefined);
    assert.equal(result.index.items.length, 2);
  });
});

// Where a registry's items live is settled once, here, and written into the
// view. The convention (items next to the index) is tried first; the other
// layouts only matter when it fails, and a transient failure on the
// convention must not be mistaken for a gated origin.
import { resolveItemBase } from "./registries.mjs";
import { itemBaseCandidates } from "../lib/data-io.mjs";

const NAMES = ["a", "b", "c"];
const statusMap = (table) => async (url) => table[url] ?? 404;

describe("itemBaseCandidates", () => {
  it("puts the convention first and dedupes", () => {
    const entry = {
      url: "https://x.test/",
      registry_url: "https://x.test/r/registry.json",
    };
    assert.deepEqual(itemBaseCandidates(entry), [
      "https://x.test/r",
      "https://x.test",
    ]);
  });

  it("offers /r when the index is served at the origin root", () => {
    const entry = {
      url: "https://x.test",
      registry_url: "https://x.test/registry.json",
    };
    assert.deepEqual(itemBaseCandidates(entry), [
      "https://x.test",
      "https://x.test/r",
    ]);
  });
});

describe("resolveItemBase", () => {
  it("keeps the convention when it answers", async () => {
    const r = await resolveItemBase(
      ["https://x.test/r", "https://x.test"],
      NAMES,
      statusMap({ "https://x.test/r/a.json": 200 }),
    );
    assert.deepEqual(r, { itemBase: "https://x.test/r", resolvable: true });
  });

  it("moves to the next candidate when the convention 404s", async () => {
    const r = await resolveItemBase(
      ["https://x.test", "https://x.test/r"],
      NAMES,
      statusMap({ "https://x.test/r/b.json": 200 }),
    );
    assert.deepEqual(r, { itemBase: "https://x.test/r", resolvable: true });
  });

  it("reports gated when every candidate fails definitively", async () => {
    const r = await resolveItemBase(
      ["https://x.test/r", "https://x.test"],
      NAMES,
      statusMap({}),
    );
    assert.deepEqual(r, { itemBase: "https://x.test/r", resolvable: false });
  });

  it("gives a throttled convention the benefit of the doubt", async () => {
    const r = await resolveItemBase(
      ["https://x.test/r", "https://x.test"],
      NAMES,
      statusMap({ "https://x.test/r/a.json": 429 }),
    );
    assert.deepEqual(r, { itemBase: "https://x.test/r", resolvable: true });
  });
});

// Item by item, what /r may list. The verdict must come only from a
// definitive answer: a paywall and a rate limit both return "not 200", and
// recording the second as the first would strike a working item from the
// catalog for the length of a bad afternoon.
import { countUnavailable, probeItems } from "./registries.mjs";

const BASE = "https://x.test/r";
// Stubs the network: each answer is { status, contentType? }. A list plays
// its answers in order and repeats the last one, so a retry can be observed.
function network(table) {
  const calls = {};
  const answer = async (url) => {
    const name = url.slice(BASE.length + 1, -".json".length);
    const script = [].concat(table[name] ?? { status: 200, contentType: "application/json" });
    const n = (calls[name] = (calls[name] ?? 0) + 1);
    return script[Math.min(n, script.length) - 1];
  };
  return { answer, calls };
}
const noWait = async () => {};
// Tests ask in catalog order; the random start only matters against a quota.
const inOrder = { wait: noWait, start: 0 };

describe("probeItems", () => {
  it("marks paywalled and missing items, and leaves the rest alone", async () => {
    const { answer } = network({
      paid: { status: 402 },
      login: { status: 401 },
      forbidden: { status: 403 },
      moved: { status: 404 },
      retired: { status: 410 },
    });
    const { verdicts, unprobed } = await probeItems(
      BASE,
      ["free", "paid", "login", "forbidden", "moved", "retired"],
      { answer, ...inOrder },
    );
    assert.deepEqual(unprobed, []);
    assert.deepEqual(
      [...verdicts],
      [
        ["paid", "gated"],
        ["login", "gated"],
        ["forbidden", "gated"],
        ["moved", "gone"],
        ["retired", "gone"],
      ],
    );
  });

  it("treats a web page where the JSON should be as gone", async () => {
    // A registry that redirected /r to its marketing site answers 200 to
    // every item name, and the CLI would fail to parse each one.
    const { answer } = network({
      landing: { status: 200, contentType: "text/html; charset=utf-8" },
    });
    const { verdicts } = await probeItems(BASE, ["landing"], { answer, ...inOrder });
    assert.deepEqual([...verdicts], [["landing", "gone"]]);
  });

  it("gives a throttled or broken origin the benefit of the doubt", async () => {
    const { answer, calls } = network({
      throttled: { status: 429 },
      down: { status: 503 },
      unreachable: { status: 0 },
    });
    const { verdicts, unprobed } = await probeItems(BASE, ["throttled", "down", "unreachable"], {
      answer,
      ...inOrder,
    });
    assert.equal(verdicts.size, 0, "no verdict without a definitive answer");
    assert.deepEqual(unprobed, [], "every item was asked");
    assert.equal(calls.throttled, 3, "a transient answer is asked again before giving up");
  });

  it("takes the definitive answer a retry produces", async () => {
    const { answer, calls } = network({
      flaky: [{ status: 429 }, { status: 402 }],
      recovered: [{ status: 500 }, { status: 200, contentType: "application/json" }],
    });
    const { verdicts } = await probeItems(BASE, ["flaky", "recovered"], { answer, ...inOrder });
    assert.deepEqual([...verdicts], [["flaky", "gated"]]);
    assert.equal(calls.recovered, 2, "stops asking once the origin answers");
  });

  it("waits as long as the origin asks, when that is within the cap", async () => {
    const waits = [];
    const { answer } = network({
      patient: [{ status: 429, retryAfterMs: 3_000 }, { status: 200, contentType: "application/json" }],
      silent: [{ status: 429 }, { status: 200, contentType: "application/json" }],
    });
    await probeItems(BASE, ["patient", "silent"], { answer, start: 0, wait: async (ms) => waits.push(ms) });
    assert.deepEqual(waits.sort((a, b) => a - b), [3_000, 5_000]);
  });

  it("stops asking an origin that tells it to come back in an hour", async () => {
    // Four in flight: the first four are asked, the origin's answer to the
    // first of them ends the probe, and the rest are never requested.
    const names = Array.from({ length: 20 }, (_, i) => `item-${i}`);
    const { answer, calls } = network(
      Object.fromEntries(names.map((n) => [n, { status: 429, retryAfterMs: 3_600_000 }])),
    );
    const { verdicts, unprobed } = await probeItems(BASE, names, { answer, ...inOrder });
    assert.equal(verdicts.size, 0);
    assert.ok(Object.keys(calls).length <= 4, `asked ${Object.keys(calls).length} items, expected at most the four in flight`);
    assert.equal(unprobed.length + Object.keys(calls).length, 20, "every item is either asked or listed as unprobed");
  });

  it("stops asking an origin that keeps answering 429 without a date", async () => {
    const names = Array.from({ length: 20 }, (_, i) => `item-${i}`);
    const { answer, calls } = network(Object.fromEntries(names.map((n) => [n, { status: 429 }])));
    const { unprobed } = await probeItems(BASE, names, { answer, ...inOrder });
    const asked = Object.keys(calls).length;
    assert.ok(asked < 20, "gave up before asking for every item");
    assert.equal(unprobed.length + asked, 20);
  });

  it("keeps the verdicts it got before the origin throttled", async () => {
    // Concurrency is four, so the whole table is asked before any answer
    // lands; what matters is that the paywall verdict survives the cut.
    const { verdicts } = await probeItems(BASE, ["paid", "late"], {
      answer: network({ paid: { status: 402 }, late: { status: 429, retryAfterMs: 3_600_000 } }).answer,
      ...inOrder,
    });
    assert.deepEqual([...verdicts], [["paid", "gated"]]);
  });

  it("starts where it is told and wraps around", async () => {
    const asked = [];
    const { answer } = network({});
    await probeItems(BASE, ["a", "b", "c"], {
      answer: (url) => (asked.push(url.slice(BASE.length + 1, -".json".length)), answer(url)),
      ...inOrder,
      start: 1,
    });
    assert.deepEqual(asked, ["b", "c", "a"]);
  });
});

// A verdict is a fact about one item at one moment. Fresh answers replace
// old ones; an item the origin could not be asked keeps what it earned.
import { applyVerdicts } from "./registries.mjs";

describe("applyVerdicts", () => {
  const previous = {
    items: [{ name: "a", unavailable: "gated" }, { name: "b", unavailable: "gone" }, { name: "c" }],
  };
  const fresh = [{ name: "a" }, { name: "b" }, { name: "c" }, { name: "d" }];

  it("writes fresh verdicts and clears the ones a fresh answer contradicts", () => {
    const items = applyVerdicts(fresh, { verdicts: new Map([["c", "gated"]]), unprobed: [] }, previous);
    assert.deepEqual(items, [{ name: "a" }, { name: "b" }, { name: "c", unavailable: "gated" }, { name: "d" }]);
  });

  it("carries the earlier verdict of an item this run could not ask", () => {
    const items = applyVerdicts(fresh, { verdicts: new Map(), unprobed: ["a", "d"] }, previous);
    assert.deepEqual(items, [{ name: "a", unavailable: "gated" }, { name: "b" }, { name: "c" }, { name: "d" }]);
  });

  it("carries nothing without a previous view", () => {
    const items = applyVerdicts(fresh, { verdicts: new Map(), unprobed: ["a"] }, null);
    assert.deepEqual(items, fresh);
  });
});

describe("countUnavailable", () => {
  it("counts each verdict and ignores items without one", () => {
    assert.deepEqual(
      countUnavailable([{ unavailable: "gated" }, { unavailable: "gone" }, {}, { unavailable: "gated" }]),
      { gated: 2, gone: 1 },
    );
  });
});
