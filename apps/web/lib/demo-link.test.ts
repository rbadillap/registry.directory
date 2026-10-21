// A Preview link carries the registry's referral partnership when there is
// one and UTM tags when there is not. Getting this wrong loses a partner's
// credit or sends the visitor somewhere other than the demo.
//
// Run with: pnpm test

import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { demoHref, demoRel } from "./demo-link.ts"

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

  it("carries the partnership's parameters to a demo on another of the partner's domains", () => {
    assert.equal(
      demoHref("https://magicui.design/docs/components/dock", "card_preview", affiliate("https://pro.magicui.design/?ref=registrydirectory")),
      "https://magicui.design/docs/components/dock?ref=registrydirectory"
    )
  })

  it("tags a demo with no partnership with UTM", () => {
    const href = new URL(demoHref("https://beui.dev/components/agents/voice-orb", "item_preview"))
    assert.equal(href.searchParams.get("utm_campaign"), "item_preview")
  })
})

describe("demoRel", () => {
  it("declares an affiliate's demo link sponsored and keeps the referrer", () => {
    assert.equal(demoRel(affiliate("https://ui.aceternity.com/?ref=registrydirectory")), "sponsored noopener")
  })

  it("marks any other demo link as user-generated, not endorsed", () => {
    assert.equal(demoRel(null), "nofollow ugc noopener")
  })
})
