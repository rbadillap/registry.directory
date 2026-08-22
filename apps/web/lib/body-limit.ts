/**
 * Body-size enforcement for API routes. The Content-Length header is
 * advisory: a chunked request omits it, Number(null) is NaN, and NaN fails
 * every comparison — so a header-only guard lets an unbounded body through.
 * The only trustworthy count is the bytes actually read from the stream.
 */

/**
 * Read the request body as text, refusing to buffer more than maxBytes.
 * Returns null when the body exceeds the limit; the caller responds 413.
 */
export async function readBodyWithLimit(
  request: Request,
  maxBytes: number
): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}
