import type { AffiliateConfig } from "./types"
import { addUtmParams } from "./utm-utils.ts"

// The rel of a demo link is written out where the link is, as a literal
// for each case, so the lint rule on target="_blank" can read it:
// - to an affiliate, "sponsored noopener": the link earns a commission and
//   follows the rule of every affiliate link (#162), sending the referrer;
// - to anyone else, "nofollow ugc noopener": the author's content on the
//   author's site, not endorsed and not given our ranking.
// noopener is on both, so the page opened never gets a reference to this one.

/**
 * The address a Preview link opens, tagged the way the registry's other
 * outbound links are: with the referral partnership's parameters (?ref=,
 * ?atp=, ?via=) when the registry has one, and UTM tags otherwise.
 *
 * The referral goes on every link to a partner, whichever of their domains
 * it lands on. Whether a visit is credited is the partner's tracking to set
 * up, not something this link can know.
 */
export function demoHref(
  demoUrl: string,
  campaign: string,
  affiliate?: AffiliateConfig | null
): string {
  if (affiliate) {
    try {
      const target = new URL(demoUrl)
      for (const [key, value] of new URL(affiliate.affiliate_url).searchParams) {
        target.searchParams.set(key, value)
      }
      return target.toString()
    } catch {
      return demoUrl
    }
  }
  return addUtmParams(demoUrl, campaign)
}
