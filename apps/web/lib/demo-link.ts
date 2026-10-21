import type { MouseEvent } from "react"
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

const PREVIEW_WINDOW = "popup,width=1280,height=860"

/**
 * Opens a Preview in a window of its own, beside the directory rather than
 * over it, so results and a demo can be looked at side by side.
 *
 * Only a plain click: a modified or middle click keeps doing what the reader
 * asked the browser for (a background tab, a new tab), and the href stays
 * real for both and for anyone without script.
 */
export function openPreviewWindow(event: MouseEvent<HTMLAnchorElement>): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }
  event.preventDefault()
  // noopener: the window gets no handle back to this page, as the rel says.
  // A click is a user gesture, so popup blockers let it through.
  window.open(event.currentTarget.href, "_blank", `${PREVIEW_WINDOW},noopener`)
}
