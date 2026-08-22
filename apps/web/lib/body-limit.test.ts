// The Content-Length guard in /api/submit is advisory: a request with
// Transfer-Encoding: chunked carries no Content-Length, so the 10 KB limit
// must hold on the bytes actually read. These tests pin readBodyWithLimit
// as that enforcement (BAD-159).
//
// Run with: pnpm test

import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { readBodyWithLimit } from "./body-limit.ts"

const LIMIT = 10_000

// A streamed body with no Content-Length header — the same shape the
// server sees for Transfer-Encoding: chunked.
function chunkedRequest(chunks: string[]): Request {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return new Request("http://localhost/api/submit", {
    method: "POST",
    body: stream,
    // Node requires half-duplex for streamed request bodies.
    duplex: "half",
  } as RequestInit)
}

describe("readBodyWithLimit", () => {
  it("returns the full text of a body under the limit", async () => {
    const body = await readBodyWithLimit(
      chunkedRequest(['{"url":"', "https://example.com", '"}']),
      LIMIT
    )
    assert.equal(body, '{"url":"https://example.com"}')
  })

  it("returns null for a chunked body over the limit", async () => {
    const chunks = Array.from({ length: 3 }, () => "x".repeat(4_000))
    const body = await readBodyWithLimit(chunkedRequest(chunks), LIMIT)
    assert.equal(body, null)
  })

  it("returns null when a single chunk exceeds the limit", async () => {
    const body = await readBodyWithLimit(
      chunkedRequest(["x".repeat(LIMIT + 1)]),
      LIMIT
    )
    assert.equal(body, null)
  })

  it("accepts a body of exactly the limit", async () => {
    const exact = "x".repeat(LIMIT)
    const body = await readBodyWithLimit(chunkedRequest([exact]), LIMIT)
    assert.equal(body, exact)
  })

  it("counts bytes, not characters", async () => {
    // 4 bytes per emoji in UTF-8: 2,501 emoji = 10,004 bytes > 10,000.
    const body = await readBodyWithLimit(
      chunkedRequest(["😀".repeat(2_501)]),
      LIMIT
    )
    assert.equal(body, null)
  })

  it("returns an empty string for a request with no body", async () => {
    const request = new Request("http://localhost/api/submit", {
      method: "POST",
    })
    const body = await readBodyWithLimit(request, LIMIT)
    assert.equal(body, "")
  })
})
