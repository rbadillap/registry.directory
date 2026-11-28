// A handle that slips through could hide a registry's page, or take a name
// one of our own packages installs under.
//
// Run with: pnpm --filter @workspace/organizations test

import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { AUTOMATIC_HANDLE, checkHandle, generateHandle, RESERVED_HANDLES } from "./handles.ts"

describe("generateHandle", () => {
  it("makes a neutral team-xxxxxx handle that passes its own check", () => {
    for (let i = 0; i < 200; i++) {
      const handle = generateHandle()
      assert.match(handle, AUTOMATIC_HANDLE)
      assert.equal(checkHandle(handle), null)
    }
  })

  it("never uses easily misread characters", () => {
    const handle = generateHandle(() => new Uint8Array([0, 1, 2, 3, 4, 5]))
    assert.equal(handle, "team-abcdef")
    for (let i = 0; i < 200; i++) assert.doesNotMatch(generateHandle().slice(5), /[01ilo]/)
  })
})

describe("checkHandle", () => {
  it("refuses every reserved name, whatever the case", () => {
    for (const name of RESERVED_HANDLES) {
      assert.equal(checkHandle(name), "reserved")
    }
    assert.equal(checkHandle("Dashboard"), "format")
  })

  it("refuses the names the brief reserves for our packages", () => {
    for (const name of ["mcp", "feedback", "organizations", "dashboard"]) {
      assert.equal(checkHandle(name), "reserved")
    }
  })

  it("refuses a directory key until the cut-over", () => {
    assert.equal(checkHandle("efferd", { directoryKeys: new Set(["efferd"]) }), "directory-key")
    assert.equal(checkHandle("acme", { directoryKeys: new Set(["efferd"]) }), null)
  })

  it("refuses handles that don't fit in a URL segment", () => {
    for (const bad of ["", "-acme", "acme-", "ac_me", "a".repeat(40), "acmé"]) {
      assert.equal(checkHandle(bad), "format", bad)
    }
    assert.equal(checkHandle("a"), null)
    assert.equal(checkHandle("a".repeat(39)), null)
  })
})
