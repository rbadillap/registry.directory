"use client"

import { ArrowUpRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useAnalytics } from "@/hooks/use-analytics"
import { demoHref, openPreviewWindow } from "@/lib/demo-link"
import type { AffiliateConfig } from "@/lib/types"
import type { DemoGroup } from "@/lib/demos"

// The item page's Preview: the author's demo, in a window of its own. Shared
// by the item bar and the state that stands in for a missing source, where
// a demo is often the only way left to see the component.
export function PreviewButton({
  demoUrl,
  affiliate,
  itemLabel,
  registryName,
  variant = "default",
  group,
}: {
  // Set when the link opens the page of the item's numbered group, which
  // shows every variant together rather than this one alone.
  group?: DemoGroup
  // Filled where Preview is the page's lead action; outlined beside a
  // stronger one, such as getting access to a licensed item.
  variant?: "default" | "outline"
  demoUrl: string
  affiliate?: AffiliateConfig | null
  itemLabel: string
  registryName: string
}) {
  const analytics = useAnalytics()
  const button = (
    <Button asChild size="sm" variant={variant} className="shrink-0">
      {/* noopener without noreferrer, on purpose: authors should see that
          their visitors came from the directory. The two rels are described
          in lib/demo-link.ts. */}
      <a
        href={demoHref(demoUrl, "item_preview", affiliate)}
        target="_blank"
        rel={affiliate ? "sponsored noopener" : "nofollow ugc noopener"}
        onClick={(event) => {
          analytics.trackDemoClicked({ surface: "item" })
          openPreviewWindow(event)
        }}
      >
        Preview
        <ArrowUpRight aria-hidden="true" />
        <span className="sr-only">
          {group
            ? ` ${itemLabel}: ${registryName}'s ${group.label} page, with all ${group.count} variants (opens in a new window)`
            : ` ${itemLabel} on ${registryName}'s site (opens in a new window)`}
        </span>
      </a>
    </Button>
  )

  if (!group) return button

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-60 text-center">
          Opens {registryName}&apos;s {group.label} page, with all {group.count} variants
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
