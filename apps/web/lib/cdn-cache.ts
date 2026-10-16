// A deployment purges the CDN and ships a new catalog, so an answer built
// from the catalog, or from an origin the catalog vouched for, holds until
// the next one. A week bounds it for a deployment that stays up longer.
export const UNTIL_NEXT_DEPLOY = "public, s-maxage=604800, stale-while-revalidate=86400"

// Failures the next request might not repeat: a timeout, an origin that is
// down, a catalog still loading. Cached just long enough to absorb a burst.
export const BRIEFLY = "public, s-maxage=60"
