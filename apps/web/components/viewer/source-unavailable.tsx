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
  // The item's title or name, for the licensed state's call to action.
  itemLabel: string
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
  itemLabel,
  actions,
}: SourceUnavailableProps) {
  const Icon = ICONS[kind]

  if (kind === "gated") {
    return (
      <LicensedSource
        registryName={registryName}
        itemLabel={itemLabel}
        accessHref={visitHref}
        onAccess={onVisit}
        actions={actions}
      />
    )
  }

  const copy = {
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
  }[kind as Exclude<SourceUnavailableKind, "gated">]

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

// Bars of varying length standing in for code: the shape of a file, never
// its content. Blurred behind the access card, they say "there is source
// here" without pretending to show any.
const PLACEHOLDER_LINES = [62, 38, 0, 74, 55, 81, 46, 0, 68, 33, 77, 52, 0, 59, 41, 70, 36, 64, 0, 48, 72, 29]

function LicensedSource({
  registryName,
  itemLabel,
  accessHref,
  onAccess,
  actions,
}: {
  registryName: string
  itemLabel: string
  accessHref: string
  onAccess: () => void
  actions?: ReactNode
}) {
  return (
    <div className="relative h-full overflow-hidden bg-background">
      <div aria-hidden="true" className="absolute inset-0 space-y-2.5 px-6 py-6 blur-[3px]">
        {PLACEHOLDER_LINES.map((width, index) => (
          <div
            key={index}
            className="h-2.5 rounded-sm bg-muted-foreground/15"
            style={{ width: width ? `${width}%` : 0, marginLeft: index % 4 === 1 ? "1.5rem" : 0 }}
          />
        ))}
      </div>

      {/* An access card, not an error: the item exists and is offered under
          {registryName}'s license, and the way to it is one click away. It
          states only what the origin answered (sign in or license), never
          a price. */}
      <div className="relative flex h-full items-center justify-center p-4">
        <section
          aria-labelledby="licensed-source-title"
          className="w-full max-w-sm rounded-lg border border-border bg-background/95 p-6 text-center shadow-lg backdrop-blur-sm"
        >
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full border border-border bg-muted">
            <Lock className="size-4 text-foreground" aria-hidden="true" />
          </div>
          <h2 id="licensed-source-title" className="text-base font-medium text-foreground text-balance">
            {itemLabel} is part of {registryName}&apos;s licensed catalog
          </h2>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Sign in or get a license at {registryName} to see its source and
            install it.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm">
              <a href={accessHref} target="_blank" rel="noopener noreferrer" onClick={onAccess}>
                Get access at {registryName}
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
            {actions}
          </div>
        </section>
      </div>
    </div>
  )
}
