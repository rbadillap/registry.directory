// Team handles: the name in /dashboard/{handle} and @registrydirectory/{handle}.
// No imports on purpose: the indexer (plain Node, apps/web/scripts) imports this
// file directly to refuse a registry whose key is reserved.

// Names no team can take: the site's root routes and every package of ours,
// whose kits install at the same level as team handles. The database holds the
// same list in organizations.reserved_handles(); a test checks both agree.
export const RESERVED_HANDLES = [
  "about",
  "admin",
  "api",
  "dashboard",
  "disclosure",
  "docs",
  "feedback",
  "mcp",
  "organizations",
  "privacy",
  "r",
  "registrydirectory",
] as const

const HANDLE_FORMAT = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/

// Automatic handles look like team-7k3m9q. The alphabet skips characters that
// are easy to misread (0/o, 1/l/i).
const AUTOMATIC_PREFIX = "team-"
const AUTOMATIC_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
const AUTOMATIC_LENGTH = 6
export const AUTOMATIC_HANDLE = /^team-[a-z0-9]{6}$/

export type HandleProblem = "format" | "reserved" | "directory-key"

export interface HandleCheck {
  /**
   * Keys of the registries in the directory. Until the cut-over from the
   * current /r, a team handle can't be one of them, or the team would hide
   * that registry's page and its proxy.
   */
  directoryKeys?: ReadonlySet<string>
}

export function isReservedHandle(handle: string): boolean {
  return (RESERVED_HANDLES as readonly string[]).includes(handle.toLowerCase())
}

/** Null when the handle can be taken, or the reason it can't. */
export function checkHandle(handle: string, { directoryKeys }: HandleCheck = {}): HandleProblem | null {
  if (!HANDLE_FORMAT.test(handle)) return "format"
  if (isReservedHandle(handle)) return "reserved"
  if (directoryKeys?.has(handle)) return "directory-key"
  return null
}

export function generateHandle(random: (size: number) => Uint8Array = randomBytes): string {
  const bytes = random(AUTOMATIC_LENGTH)
  let suffix = ""
  for (const byte of bytes) suffix += AUTOMATIC_ALPHABET[byte % AUTOMATIC_ALPHABET.length]
  return AUTOMATIC_PREFIX + suffix
}

function randomBytes(size: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(size))
}
