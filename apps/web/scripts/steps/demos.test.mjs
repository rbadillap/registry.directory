// The demo links point people off the site, so a wrong one costs trust the
// directory does not get back. These pin the global rules that decide which
// URL an item gets, with a stub in place of the network.
//
// Run with: pnpm test

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { candidateKeys, matchDemos, parseLocs, readSitemap, settle, siteHost } from "./demos.mjs";

const items = (...names) => names.map((name) => ({ name, type: "registry:ui" }));

describe("parseLocs", () => {
  it("reads plain and CDATA locations and unescapes ampersands", () => {
    const xml = `<urlset>
      <url><loc>https://ui.test/docs/button</loc></url>
      <url><loc><![CDATA[https://ui.test/docs/card]]></loc></url>
      <url><loc> https://ui.test/docs/a?x=1&amp;y=2 </loc></url>
    </urlset>`;
    assert.deepEqual(parseLocs(xml), [
      "https://ui.test/docs/button",
      "https://ui.test/docs/card",
      "https://ui.test/docs/a?x=1&y=2",
    ]);
  });
});

describe("siteHost", () => {
  it("treats www. as the same site", () => {
    assert.equal(siteHost("https://www.ui.test/"), "ui.test");
    assert.equal(siteHost("not a url"), null);
  });
});

describe("matchDemos", () => {
  it("pairs an item with the URL whose last segment is its name", () => {
    const { demos } = matchDemos(items("voice-orb"), ["https://ui.test/components/agents/voice-orb"], new Set(["ui.test"]));
    assert.deepEqual(demos, { "voice-orb": "https://ui.test/components/agents/voice-orb" });
  });

  it("keeps only URLs on the registry's own host", () => {
    const { demos } = matchDemos(
      items("button"),
      ["https://staging.ui.test/docs/button", "https://other.test/docs/button"],
      new Set(["ui.test"])
    );
    assert.deepEqual(demos, {});
  });

  it("requires an allowed path and refuses a denied one", () => {
    const { demos } = matchDemos(
      items("button", "card", "badge"),
      [
        "https://ui.test/button",
        "https://ui.test/blog/card",
        "https://ui.test/docs/changelog/badge",
      ],
      new Set(["ui.test"])
    );
    assert.deepEqual(demos, {});
  });

  it("drops a name two URLs answer to", () => {
    const result = matchDemos(
      items("button"),
      ["https://ui.test/docs/radix/button", "https://ui.test/docs/base/button"],
      new Set(["ui.test"])
    );
    assert.deepEqual(result.demos, {});
    assert.equal(result.ambiguous, 1);
  });

  it("counts the same URL twice as one, with or without a trailing slash", () => {
    const { demos } = matchDemos(
      items("button"),
      ["https://ui.test/docs/button", "https://ui.test/docs/button"],
      new Set(["ui.test"])
    );
    assert.deepEqual(demos, { button: "https://ui.test/docs/button" });
  });

  it("matches names case-insensitively and skips items the origin no longer serves", () => {
    const { demos } = matchDemos(
      [{ name: "Hero", type: "registry:block" }, { name: "gone", type: "registry:ui", resolution: "gone" }],
      ["https://ui.test/blocks/hero", "https://ui.test/blocks/gone"],
      new Set(["ui.test"])
    );
    assert.deepEqual(demos, { Hero: "https://ui.test/blocks/hero" });
  });

  it("ignores URLs that are not http(s) or not URLs at all", () => {
    const { demos } = matchDemos(items("button"), ["javascript:alert(1)//docs/button", "::"], new Set(["ui.test"]));
    assert.deepEqual(demos, {});
  });
});

describe("settle", () => {
  const previous = { demos: { a: "https://ui.test/docs/a", b: "https://ui.test/docs/b", c: "https://ui.test/docs/c" } };

  it("keeps last week's links when the sitemap cannot be read", () => {
    const result = settle({ error: "sitemap.xml HTTP 500" }, previous, items("a", "b", "c"));
    assert.equal(result.status, "reused");
    assert.equal(Object.keys(result.demos).length, 3);
  });

  it("keeps last week's links when matches fall by more than half", () => {
    const result = settle({ demos: { a: "https://ui.test/docs/a" } }, previous, items("a", "b", "c"));
    assert.equal(result.status, "reused");
    assert.match(result.reason, /fell from 3 to 1/);
  });

  it("accepts a fresh map that holds up", () => {
    const fresh = { demos: { a: "x", b: "y" } };
    assert.deepEqual(settle(fresh, previous, items("a", "b", "c")), { status: "ok", demos: fresh.demos, groups: [] });
  });

  it("drops carried links for items the view no longer lists", () => {
    const result = settle({ error: "boom" }, previous, items("a"));
    assert.deepEqual(result.demos, { a: "https://ui.test/docs/a" });
  });

  it("is missing when there is nothing to fall back on", () => {
    assert.equal(settle({ error: "boom" }, null, items("a")).status, "missing");
  });
});

describe("readSitemap", () => {
  const serve = (pages) => {
    const asked = [];
    const get = async (url) => {
      asked.push(url);
      return url in pages ? { text: pages[url] } : { error: "HTTP 404" };
    };
    return { get, asked };
  };

  it("reads a plain sitemap in one request", async () => {
    const { get, asked } = serve({
      "https://ui.test/sitemap.xml": "<urlset><url><loc>https://ui.test/docs/a</loc></url></urlset>",
    });
    const result = await readSitemap("https://ui.test/", get);
    assert.deepEqual(result.urls, ["https://ui.test/docs/a"]);
    assert.equal(result.requests, 1);
    assert.equal(asked.length, 1);
  });

  it("follows at most three children of an index, components first", async () => {
    const index = `<sitemapindex>
      <sitemap><loc>https://ui.test/sitemap-pages.xml</loc></sitemap>
      <sitemap><loc>https://ui.test/sitemap-posts.xml</loc></sitemap>
      <sitemap><loc>https://cdn.other.test/sitemap-components.xml</loc></sitemap>
      <sitemap><loc>https://ui.test/sitemap-extra.xml</loc></sitemap>
      <sitemap><loc>https://ui.test/sitemap-components.xml</loc></sitemap>
    </sitemapindex>`;
    const { get, asked } = serve({
      "https://ui.test/sitemap.xml": index,
      "https://ui.test/sitemap-components.xml": "<urlset><url><loc>https://ui.test/components/a</loc></url></urlset>",
    });
    const result = await readSitemap("https://ui.test", get);
    assert.equal(result.requests, 4);
    // A host the index itself names is the registry's own, and a sitemap
    // named for components goes first, wherever it lives.
    assert.equal(asked[1], "https://cdn.other.test/sitemap-components.xml");
    assert.deepEqual(result.ownHosts, ["cdn.other.test"]);
  });

  it("accepts the host the homepage's sitemap redirects to, and only that one", async () => {
    const get = async () => ({
      finalUrl: "https://new.test/sitemap.xml",
      text: `<urlset>
        <url><loc>https://new.test/docs/a</loc></url>
        <url><loc>https://elsewhere.test/docs/b</loc></url>
      </urlset>`,
    });
    const result = await readSitemap("https://old.test", get);
    assert.deepEqual(result.ownHosts, ["new.test"]);
    assert.deepEqual(
      matchDemos(items("a", "b"), result.urls, result.hosts).demos,
      { a: "https://new.test/docs/a" }
    );
  });

  it("takes the hosts the homepage's own index names as the registry's", async () => {
    const { get } = serve({
      "https://ui.beste.test/sitemap.xml": "<sitemapindex><sitemap><loc>https://beste.test/sitemap-blocks.xml</loc></sitemap></sitemapindex>",
      "https://beste.test/sitemap-blocks.xml": "<urlset><url><loc>https://beste.test/block/hero1</loc></url></urlset>",
    });
    const result = await readSitemap("https://ui.beste.test", get);
    assert.deepEqual(result.ownHosts, ["beste.test"]);
    assert.deepEqual(matchDemos(items("hero1"), result.urls, result.hosts).demos, { hero1: "https://beste.test/block/hero1" });
  });

  it("does not take hosts from the pages an ordinary sitemap lists", async () => {
    const { get } = serve({
      "https://ui.test/sitemap.xml": "<urlset><url><loc>https://elsewhere.test/docs/a</loc></url></urlset>",
    });
    const result = await readSitemap("https://ui.test", get);
    assert.equal(result.ownHosts, undefined);
    assert.deepEqual(matchDemos(items("a"), result.urls, result.hosts).demos, {});
  });

  it("reports a page that is not a sitemap", async () => {
    const { get } = serve({ "https://ui.test/sitemap.xml": "<!doctype html><html></html>" });
    assert.match((await readSitemap("https://ui.test", get)).error, /not a sitemap/);
  });
});

describe("matching beyond the exact name", () => {
  const hosts = new Set(["ui.test"]);

  it("follows the author's title when the name does not match", () => {
    const result = matchDemos(
      [{ name: "hero1", title: "Hero Section 1", type: "registry:block" }],
      ["https://ui.test/blocks/hero-section-1"],
      hosts
    );
    assert.deepEqual(result.demos, { hero1: "https://ui.test/blocks/hero-section-1" });
    assert.deepEqual(result.groups, []);
  });

  it("finds a demo item's component page without its -demo suffix", () => {
    const result = matchDemos(items("bg-animate-button-demo"), ["https://ui.test/docs/components/bg-animate-button"], hosts);
    assert.deepEqual(result.demos, { "bg-animate-button-demo": "https://ui.test/docs/components/bg-animate-button" });
  });

  it("links a numbered variant to its group's page and records it as a group link", () => {
    const result = matchDemos(items("accordion-01", "accordion-02"), ["https://ui.test/docs/components/accordion"], hosts);
    assert.equal(result.demos["accordion-01"], "https://ui.test/docs/components/accordion");
    assert.deepEqual(result.groups, ["accordion-01", "accordion-02"]);
  });

  it("prefers a page of the item's own over its group's", () => {
    const result = matchDemos(
      items("pricing-2"),
      ["https://ui.test/blocks/pricing-2", "https://ui.test/blocks/pricing"],
      hosts
    );
    assert.equal(result.demos["pricing-2"], "https://ui.test/blocks/pricing-2");
    assert.deepEqual(result.groups, []);
  });

  it("stops at an ambiguous key instead of falling back to a weaker one", () => {
    const result = matchDemos(
      [{ name: "card-1", title: "Card", type: "registry:ui" }],
      ["https://ui.test/docs/radix/card", "https://ui.test/docs/base/card"],
      hosts
    );
    assert.deepEqual(result.demos, {});
    assert.equal(result.ambiguous, 1);
  });

  it("never offers the same key twice", () => {
    const keys = candidateKeys({ name: "button", title: "Button" }).map(([, key]) => key);
    assert.deepEqual(keys, ["button"]);
  });
});

describe("settle with group links", () => {
  it("carries group marks along with the links they belong to", () => {
    const previous = { demos: { "a-1": "https://ui.test/docs/a", b: "https://ui.test/docs/b" }, groups: ["a-1"] };
    const result = settle({ error: "boom" }, previous, items("a-1", "b"));
    assert.deepEqual(result.groups, ["a-1"]);
  });
});
