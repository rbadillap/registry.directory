/**
 * URL shapes of the site. Distinct from path-utils, which deals with file
 * paths inside a registry item.
 */

/**
 * An item name may contain slashes, so a catch-all route receives it split
 * into segments. Rejoining them recovers the name the registry published,
 * which is the key every lookup uses.
 */
export function slugFromSegments(segments: string[]): string {
  return segments.join("/")
}
