import type { MouseEvent } from "react"
import type { AffiliateConfig } from "./types"
import { addUtmParams } from "./utm-utils.ts"

// Author demo links are user-generated content on another site: not
// endorsed, not given our ranking, and never handed a reference to this page.
export const DEMO_LINK_REL = "nofollow ugc noopener"

function siteHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return null
  }
}

/**
 * The address a Preview link opens, tagged the way the registry's other
 * outbound links are.
 *
 * With a referral partnership whose link lives on the demo's own host, the
 * partnership's parameters (?ref=, ?atp=, ?via=) ride along, so a visit that
 * starts at a demo is credited like one that starts at the homepage. A
 * partnership on another host (pro.magicui.design for demos on
 * magicui.design) cannot be carried to a demo without sending the visitor
 * somewhere else, so those demos get the same UTM tags as everything else.
 */
export function demoHref(
  demoUrl: string,
  campaign: string,
  affiliate?: AffiliateConfig | null
): string {
  if (affiliate && siteHost(affiliate.affiliate_url) === siteHost(demoUrl)) {
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
