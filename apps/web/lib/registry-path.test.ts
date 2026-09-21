// A registry needs a route on this site whether or not it has a repo or an
// official shadcn namespace. These tests pin the three cases, and that the
// name-slug handle equals the key the indexer files the view under — if the
// two drift, the page exists and its catalog does not.
//
// Run with: pnpm test

import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { entryHandle, registryBasePath } from "./registry-path.ts"
import { registryKey } from "../scripts/lib/data-io.mjs"

const base = { description: "", url: "https://example.com" }

describe("registryBasePath", () => {
  it("uses the github pair when there is a repo", () => {
    const entry = { ...base, name: "Acme", github_url: "https://github.com/acme/ui.git", namespace: "@acme" }
    assert.equal(registryBasePath(entry), "/acme/ui")
  })

  it("uses the namespace when there is no repo", () => {
    const entry = { ...base, name: "Acme UI", namespace: "@acme" }
    assert.equal(registryBasePath(entry), "/acme")
  })

  it("falls back to the name slug when there is neither", () => {
    const entry = { ...base, name: "Acme UI — Pro!" }
    assert.equal(registryBasePath(entry), "/acme-ui-pro")
    assert.equal(entryHandle(entry), registryKey(entry))
  })

  it("gives a github-backed entry without a namespace no handle alias", () => {
    const entry = { ...base, name: "Acme", github_url: "https://github.com/acme/ui" }
    assert.equal(entryHandle(entry), null)
  })

  it("has no route for a name that slugs to nothing", () => {
    assert.equal(registryBasePath({ ...base, name: "—" }), null)
  })
})
