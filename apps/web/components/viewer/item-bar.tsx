"use client"

import type { ReactNode } from "react"
import { CopyButton } from "@/components/registry-landing/copy-button"
import { useAnalytics } from "@/hooks/use-analytics"
import type { ItemResolution } from "@/lib/registry-data"

interface ItemBarProps {
  registryName: string
  name: string
  title?: string
  description?: string
  // What follows `npx shadcn@latest add` for this item.
  installArg: string
  resolution?: ItemResolution
  // Room for actions beside the command; nothing is drawn when absent.
  actions?: ReactNode
}

// Said plainly and only as far as the probe knows: a 401 is not proof that
// an item is paid, and a page that once answered is not proof it is free.
function resolutionNote(resolution: ItemResolution, registryName: string): string {
  switch (resolution) {
    case "gated":
      return `${registryName} asked for a sign-in or license at the last check.`
    case "gone":
      return `${registryName} didn't serve this item at the last check.`
    case "unverified":
      return `Not checked yet: ${registryName} limits how often it can be asked.`
  }
}

// What the item is and how to get it, above the code. The viewer below
// answers how it is built; this answers the two questions that come first.
export function ItemBar({
  registryName,
  name,
  title,
  description,
  installArg,
  resolution,
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

      <div className="flex min-w-0 flex-col gap-1.5 md:max-w-[min(560px,55%)] md:items-end">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 min-w-0 flex-1 items-center gap-2.5 rounded-md border border-border bg-surface/50 px-3 font-mono text-xs">
            <span className="select-none text-foreground-faint" aria-hidden="true">
              $
            </span>
            <code className="min-w-0 flex-1 truncate text-foreground" title={command}>
              {command}
            </code>
            <CopyButton
              text={command}
              label="Copy install command"
              onCopy={() => analytics.trackInstallCopied()}
            />
          </div>
          {actions}
        </div>
        {resolution && (
          <p className="text-xs text-muted-foreground">
            {resolutionNote(resolution, registryName)}
          </p>
        )}
      </div>
    </section>
  )
}
