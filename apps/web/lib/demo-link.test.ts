// A Preview link carries the registry's referral partnership when it can and
// UTM tags when it cannot. Getting this wrong either loses an author's credit
// or sends the visitor somewhere other than the demo.
//
// Run with: pnpm test

import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { demoHref } from "./demo-link.ts"

const affiliate = (affiliate_url: string) => ({
  url: "https://example.test/",
  affiliate_url,
  label: "Example",
  program: "example",
})

describe("demoHref", () => {
  it("carries the partnership's parameters to a demo on the same host", () => {
    assert.equal(
      demoHref("https://ui.aceternity.com/components/hero", "item_preview", affiliate("https://ui.aceternity.com/?ref=registrydirectory")),
      "https://ui.aceternity.com/components/hero?ref=registrydirectory"
    )
  })

  it("treats www. as the same host", () => {
    assert.equal(
      demoHref("https://www.craft.test/blocks/a", "item_preview", affiliate("https://craft.test/?atp=registrydirectory")),
      "https://www.craft.test/blocks/a?atp=registrydirectory"
    )
  })

  it("falls back to UTM tags when the partnership lives on another host", () => {
    const href = new URL(
      demoHref("https://magicui.design/docs/components/dock", "card_preview", affiliate("https://pro.magicui.design/?ref=registrydirectory"))
    )
    assert.equal(href.pathname, "/docs/components/dock")
    assert.equal(href.searchParams.get("ref"), null)
    assert.equal(href.searchParams.get("utm_source"), "registry.directory")
    assert.equal(href.searchParams.get("utm_campaign"), "card_preview")
  })

  it("tags a demo with no partnership with UTM", () => {
    const href = new URL(demoHref("https://beui.dev/components/agents/voice-orb", "item_preview"))
    assert.equal(href.searchParams.get("utm_campaign"), "item_preview")
  })
})
