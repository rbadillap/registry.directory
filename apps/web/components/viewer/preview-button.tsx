"use client"

import { ArrowUpRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useAnalytics } from "@/hooks/use-analytics"
import { demoHref } from "@/lib/demo-link"
import type { AffiliateConfig } from "@/lib/types"

// The item page's Preview: the author's demo, in a new tab. Shared
// by the item bar and the state that stands in for a missing source, where
// a demo is often the only way left to see the component.
export function PreviewButton({
  demoUrl,
  affiliate,
  itemLabel,
  registryName,
  variant = "default",
}: {
  // Filled where Preview is the page's lead action; outlined beside a
  // stronger one, such as getting access to a licensed item.
  variant?: "default" | "outline"
  demoUrl: string
  affiliate?: AffiliateConfig | null
  itemLabel: string
  registryName: string
}) {
  const analytics = useAnalytics()
  return (
    <Button asChild size="sm" variant={variant} className="shrink-0">
      {/* noopener without noreferrer, on purpose: authors should see that
          their visitors came from the directory. The two rels are described
          in lib/demo-link.ts. */}
      <a
        href={demoHref(demoUrl, "item_preview", affiliate)}
        target="_blank"
        rel={affiliate ? "sponsored noopener" : "nofollow ugc noopener"}
        onClick={() => analytics.trackDemoClicked({ surface: "item" })}
      >
        Preview
        <ArrowUpRight aria-hidden="true" />
        <span className="sr-only">
          {` ${itemLabel} on ${registryName}'s site (opens in a new tab)`}
        </span>
      </a>
    </Button>
  )
}
