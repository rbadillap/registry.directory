"use client"

import type { ReactNode } from "react"
import { CopyButton } from "@/components/registry-landing/copy-button"
import { useAnalytics } from "@/hooks/use-analytics"

interface ItemBarProps {
  registryName: string
  name: string
  title?: string
  description?: string
  // What follows `npx shadcn@latest add` for this item.
  installArg: string
  // Room for actions beside the command; nothing is drawn when absent.
  actions?: ReactNode
}

// What the item is and how to get it, above the code. The viewer below
// answers how it is built; this answers the two questions that come first.
export function ItemBar({
  registryName,
  name,
  title,
  description,
  installArg,
  actions,
}: ItemBarProps) {
  const analytics = useAnalytics()
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

      {/* On a phone the command gets a row of its own and wraps, so the
          item's own part is never the part that is cut. From md up it is one
          line, and the invariant prefix gives way before the item does. */}
      <div className="flex min-w-0 flex-wrap items-center gap-2 md:max-w-[min(560px,55%)] md:flex-nowrap">
        <div className="flex min-h-8 min-w-0 basis-full items-start gap-2.5 rounded-md border border-border bg-surface/50 px-3 py-1.5 font-mono text-xs md:basis-auto md:flex-1 md:items-center">
          <span className="select-none leading-5 text-foreground-faint" aria-hidden="true">
            $
          </span>
          <code className="min-w-0 flex-1 break-all leading-5 md:flex md:break-normal" title={command}>
            <span className="text-muted-foreground md:min-w-0 md:shrink-[1000] md:truncate">
              {"npx shadcn@latest add\u00a0"}
            </span>
            <span className="text-foreground md:min-w-0 md:truncate">{installArg}</span>
          </code>
          <CopyButton
            text={command}
            label="Copy install command"
            onCopy={() => analytics.trackInstallCopied()}
          />
        </div>
        {actions}
      </div>
    </section>
  )
}
