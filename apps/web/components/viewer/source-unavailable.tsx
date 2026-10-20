"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight, Clock, FileX, Lock, RotateCw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"

// Why an item's source is not on screen. One component, four voices: what
// changes between them is what happened and what can be done about it, not
// the layout. Each says only what is known: a refusal is not proof an item
// is paid, and a missing answer is not proof it is gone.
export type SourceUnavailableKind = "gated" | "gone" | "unverified" | "error"

interface SourceUnavailableProps {
  kind: SourceUnavailableKind
  registryName: string
  visitHref: string
  onVisit: () => void
  categoryHref: string
  categoryLabel: string
  onRetry: () => void
  errorMessage?: string
  // Extra actions placed first, such as a Preview of the author's demo.
  actions?: ReactNode
}

const ICONS = {
  gated: Lock,
  gone: FileX,
  unverified: Clock,
  error: RotateCw,
} as const

export function SourceUnavailable({
  kind,
  registryName,
  visitHref,
  onVisit,
  categoryHref,
  categoryLabel,
  onRetry,
  errorMessage,
  actions,
}: SourceUnavailableProps) {
  const Icon = ICONS[kind]

  const copy = {
    gated: {
      title: `Behind a license at ${registryName}`,
      description: `${registryName} asked for a sign-in or license when this directory last checked, so the source isn't shown here. The name, description and files come from ${registryName}'s own index.`,
    },
    gone: {
      title: `${registryName} no longer serves this item`,
      description: `It's still listed in ${registryName}'s index, but asking for it returns nothing, so it can't be installed. The name, description and files are kept from that index.`,
    },
    unverified: {
      title: "Not checked yet",
      description: `${registryName} limits how often it can be asked, and this item hasn't had its turn. Its source will show here once it has.`,
    },
    error: {
      title: "Couldn't load the source",
      description: `${errorMessage ? `${errorMessage} ` : ""}The rest of this page comes from the directory's own catalog.`,
    },
  }[kind]

  const visit = (
    <Button asChild variant="outline" size="sm">
      <a href={visitHref} target="_blank" rel="noopener noreferrer" onClick={onVisit}>
        Visit {registryName}
        <ArrowUpRight aria-hidden="true" />
      </a>
    </Button>
  )

  return (
    <Empty role="status" className="h-full rounded-none border-0 bg-background">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle className="text-base">{copy.title}</EmptyTitle>
        <EmptyDescription>{copy.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {kind === "error" ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCw aria-hidden="true" />
              Try again
            </Button>
          ) : (
            <>
              {actions}
              {visit}
            </>
          )}
        </div>
        {kind === "gone" && (
          <Link
            href={categoryHref}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Other {categoryLabel.toLowerCase()} from {registryName}
          </Link>
        )}
      </EmptyContent>
    </Empty>
  )
}
