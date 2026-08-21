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
