// /r proxies each item from its origin. When the origin refuses, the code
// /r answers tells the CLI, agents and the registry health check whether to
// retry, give up, or blame the origin.
//
// Run with: pnpm test

import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { BRIEFLY, FOR_AN_HOUR } from "./cdn-cache.ts"
import { originFailure } from "./origin-failure.ts"

describe("originFailure", () => {
  it("passes a 404 through, cached briefly", () => {
    const f = originFailure(404, "Example", "button")
    assert.equal(f.status, 404)
    assert.equal(f.cacheControl, BRIEFLY)
    assert.equal(f.headers, undefined)
  })

  it("answers 403 for an item that now needs a licence, cached for an hour", () => {
    for (const code of [401, 402]) {
      const f = originFailure(code, "Example", "button")
      assert.equal(f.status, 403)
      assert.equal(f.cacheControl, FOR_AN_HOUR)
      assert.match(f.body.error, /now requires a license from Example/)
      assert.match(f.body.error, new RegExp(`responded ${code}`))
    }
  })

  it("answers 503 with the origin's Retry-After when it throttles", () => {
    const f = originFailure(429, "Example", "button", "120")
    assert.equal(f.status, 503)
    assert.equal(f.cacheControl, BRIEFLY)
    assert.deepEqual(f.headers, { "Retry-After": "120" })
  })

  it("defaults Retry-After to 60 seconds when the origin gives none", () => {
    assert.deepEqual(originFailure(429, "Example", "button").headers, { "Retry-After": "60" })
    assert.deepEqual(originFailure(429, "Example", "button", " ").headers, { "Retry-After": "60" })
  })

  it("keeps 502 for a WAF's 403 and for server errors", () => {
    for (const code of [403, 500, 503]) {
      const f = originFailure(code, "Example", "button")
      assert.equal(f.status, 502)
      assert.equal(f.cacheControl, BRIEFLY)
    }
  })
})
