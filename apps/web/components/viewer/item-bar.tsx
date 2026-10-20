"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CircleHelp } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { CopyButton } from "@/components/registry-landing/copy-button"
import { ShadcnIcon } from "@/components/icons/shadcn"
import { useAnalytics } from "@/hooks/use-analytics"
import { PreviewButton } from "./preview-button"
import type { AffiliateConfig } from "@/lib/types"

interface ItemBarProps {
  registryName: string
  name: string
  title?: string
  description?: string
  // What follows `npx shadcn@latest add` for this item; absent when the
  // item cannot be installed.
  installArg?: string
  // The page on the author's own site where the item can be seen working.
  demoUrl?: string
  // The registry's referral partnership, carried to the demo when it can be.
  affiliate?: AffiliateConfig | null
}

// What the item is and how to get it, above the code. The viewer below
// answers how it is built; this answers the two questions that come first.
export function ItemBar({
  registryName,
  name,
  title,
  description,
  installArg,
  demoUrl,
  affiliate,
}: ItemBarProps) {
  const analytics = useAnalytics()
  const pathname = usePathname()
  const command = `npx shadcn@latest add ${installArg}`

  return (
    <section
      aria-labelledby="item-bar-title"
      className="flex flex-col gap-3 border-b border-border bg-background px-4 py-3 md:flex-row md:items-center md:gap-6 md:px-6"
    >
      <div className="min-w-0 flex-1">
        <h1 id="item-bar-title" className="truncate text-sm font-medium text-foreground">
          {title || name}
          <span className="font-normal text-muted-foreground"> · {registryName}</span>
        </h1>
        {description && (
          <p className="truncate text-xs text-muted-foreground" title={description}>
            {description}
          </p>
        )}
      </div>

      {/* The shadcn mark stands for `npx shadcn@latest add`, which every
          command shares; what is written out is only what this item adds.
          Copying still copies the whole command. On a phone it wraps rather
          than cut the item's ref. */}
      <div className="flex min-w-0 flex-wrap items-center gap-2 md:max-w-[min(560px,55%)] md:flex-nowrap">
        {installArg && (
          <div className="flex min-h-8 min-w-0 basis-full items-start gap-2.5 rounded-md border border-border bg-surface/50 px-3 py-1.5 font-mono text-xs md:basis-auto md:flex-1 md:items-center">
            <ShadcnIcon className="mt-0.5 size-4 shrink-0 text-foreground md:mt-0" aria-hidden="true" />
            <code className="min-w-0 flex-1 break-all leading-5 text-foreground md:truncate md:break-normal" title={command}>
              <span className="sr-only">npx shadcn@latest add </span>
              {installArg}
            </code>
            <CopyButton
              text={command}
              label="Copy install command"
              onCopy={() => analytics.trackInstallCopied()}
            />
          </div>
        )}
        {/* The one filled button on the page: seeing the component work
            is what people asked for first. Absent, not disabled, when the
            author's sitemap names no page for it. */}
        {demoUrl && (
          <PreviewButton
            demoUrl={demoUrl}
            affiliate={affiliate}
            itemLabel={title || name}
            registryName={registryName}
          />
        )}
        {/* Where the link came from, for the reader who wonders and the
            author who wants one. The tooltip only invites; the page behind
            it, which also works on touch, explains, and offers the way
            back to this item. */}
        {demoUrl && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/docs?${new URLSearchParams({ from: pathname, label: title || name })}#preview-links`}
                  aria-label="How Preview links are found"
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CircleHelp className="size-4" aria-hidden="true" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                How Preview links work
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </section>
  )
}
