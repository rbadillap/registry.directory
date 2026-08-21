// Component names are published with hyphens and typed with spaces. Every
// surface that searches them has to treat the two as the same thing, and the
// case that motivated these — "alert dialog" finding alert-dialog — is easy to
// undo by accident.
//
// Run with: pnpm test

import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { normalizeForSearch, searchItems, searchTerms } from "./search-utils.ts"
import type { IndexedItem } from "./items-index.ts"

const matches = (query: string, text: string): boolean => {
  const terms = searchTerms(query)
  const haystack = normalizeForSearch(text)
  return terms.every((term) => haystack.includes(term))
}

describe("normalizeForSearch", () => {
  it("reads the separators a name uses as spaces", () => {
    assert.equal(normalizeForSearch("alert-dialog"), "alert dialog")
    assert.equal(normalizeForSearch("use_mobile"), "use mobile")
    assert.equal(normalizeForSearch("ui/blocks/hero"), "ui blocks hero")
  })

  it("lowercases and collapses runs of whitespace", () => {
    assert.equal(normalizeForSearch("  Alert   Dialog "), "alert dialog")
    assert.equal(normalizeForSearch("alert--dialog"), "alert dialog")
  })
})

describe("searchTerms", () => {
  it("splits on spaces and on separators alike", () => {
    assert.deepEqual(searchTerms("alert dialog"), ["alert", "dialog"])
    assert.deepEqual(searchTerms("alert-dialog"), ["alert", "dialog"])
  })

  it("is empty for a query with nothing in it", () => {
    assert.deepEqual(searchTerms(""), [])
    assert.deepEqual(searchTerms("   "), [])
  })
})

describe("a query finds a name spelled the other way", () => {
  it("finds alert-dialog when the words are typed with a space", () => {
    assert.ok(matches("alert dialog", "alert-dialog"))
  })

  it("works in the other direction too", () => {
    assert.ok(matches("alert-dialog", "alert dialog"))
    assert.ok(matches("alert_dialog", "alert-dialog"))
  })

  it("still matches when the words are typed out of order", () => {
    assert.ok(matches("dialog alert", "alert-dialog"))
  })

  it("matches a name nested under folders", () => {
    assert.ok(matches("browser utils", "ui/lib/browser-utils"))
  })

  it("does not match a word the text does not contain", () => {
    assert.equal(matches("alert sheet", "alert-dialog"), false)
  })
})

// The helpers being right is not the same as the search using them: the two
// surfaces drifted apart once already, and only a test that goes through
// searchItems would have said so.
const item = (
  name: string,
  description = "",
  registry = "shadcn/ui"
): IndexedItem => ({
  name,
  type: "registry:ui",
  description,
  categories: [],
  registry: { name: registry, basePath: "/shadcn-ui/ui", avatarUrl: null },
})

const names = (results: IndexedItem[]): string[] => results.map((r) => r.name)

describe("searchItems", () => {
  const catalog = [
    item("alert-dialog", "A modal dialog that interrupts."),
    item("alert", "Displays a callout."),
    item("dialog", "A window overlaid on the page."),
    item("use_mobile", "Hook that reports viewport width."),
    item("sheet", "Extends the dialog component."),
  ]

  it("finds a hyphenated name from words typed with a space", () => {
    assert.deepEqual(names(searchItems(catalog, "alert dialog")), ["alert-dialog"])
  })

  it("finds it however the separators are typed", () => {
    assert.deepEqual(names(searchItems(catalog, "alert-dialog")), ["alert-dialog"])
    assert.deepEqual(names(searchItems(catalog, "alert_dialog")), ["alert-dialog"])
  })

  it("finds an underscored name from words typed with a space", () => {
    assert.deepEqual(names(searchItems(catalog, "use mobile")), ["use_mobile"])
  })

  it("does not care in which order the words were typed", () => {
    assert.deepEqual(names(searchItems(catalog, "dialog alert")), ["alert-dialog"])
  })

  it("ranks the name that was spelled out above the ones that merely contain it", () => {
    const results = names(searchItems(catalog, "dialog"))
    assert.equal(results[0], "dialog", "the exact name comes first")
    assert.ok(results.includes("alert-dialog"))
  })

  it("still requires every word to appear", () => {
    assert.deepEqual(searchItems(catalog, "alert stepper"), [])
  })

  it("returns nothing for an empty query", () => {
    assert.deepEqual(searchItems(catalog, "   "), [])
  })
})
