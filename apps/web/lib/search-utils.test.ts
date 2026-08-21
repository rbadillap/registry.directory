// Component names are published with hyphens and typed with spaces. Every
// surface that searches them has to treat the two as the same thing, and the
// case that motivated these — "alert dialog" finding alert-dialog — is easy to
// undo by accident.
//
// Run with: pnpm test

import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { normalizeForSearch, searchTerms } from "./search-utils.ts"

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
