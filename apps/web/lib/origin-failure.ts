import { BRIEFLY, FOR_AN_HOUR } from "./cdn-cache.ts"

export interface OriginFailure {
  status: number
  body: { error: string }
  cacheControl: string
  headers?: Record<string, string>
}

// What /r answers when an origin refuses an item the catalog lists. The code
// tells the caller what to do next:
// - 404: the origin no longer has it (an index that moved, a deploy caught
//   mid-flight). Kept briefly, so a passing one does not withhold the item.
// - 401/402: the item now needs a licence. 403 says so; retrying will not
//   help, and the next indexing withholds it from /r.
// - 429: the origin is throttling. 503 with Retry-After tells the caller to
//   come back, and the brief cache keeps a burst from reaching the origin.
// - anything else (a WAF's 403, a 5xx): 502, the origin failed us.
export function originFailure(
  originStatus: number,
  registryName: string,
  itemName: string,
  retryAfter?: string | null
): OriginFailure {
  const said = `Origin registry "${registryName}" responded ${originStatus} for "${itemName}".`

  if (originStatus === 404) {
    return { status: 404, body: { error: said }, cacheControl: BRIEFLY }
  }

  if (originStatus === 401 || originStatus === 402) {
    return {
      status: 403,
      body: {
        error: `"${itemName}" now requires a license from ${registryName}. ${said}`,
      },
      cacheControl: FOR_AN_HOUR,
    }
  }

  if (originStatus === 429) {
    return {
      status: 503,
      body: { error: `${said} Retry later.` },
      cacheControl: BRIEFLY,
      headers: { "Retry-After": String(retryAfterSeconds(retryAfter)) },
    }
  }

  return { status: 502, body: { error: said }, cacheControl: BRIEFLY }
}

// The origin controls its Retry-After and we hand it to every caller, so only
// whole seconds within an hour pass. Anything else, an HTTP date included,
// becomes 60.
function retryAfterSeconds(value?: string | null): number {
  const trimmed = value?.trim() ?? ""
  if (!/^\d+$/.test(trimmed)) return 60
  const seconds = Number(trimmed)
  return seconds >= 1 && seconds <= 3600 ? seconds : 60
}
