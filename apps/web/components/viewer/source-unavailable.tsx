"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight, Clock, FileX, Lock, RotateCw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

// Why an item's source is not on screen, said where the source would be.
// One card, four voices: what changes between them is what happened and the
// one thing to do next, not the layout. Each says only what is known: a
// refusal is not proof that an item is paid, and an unanswered request is
// not proof that it is gone.
export type SourceUnavailableKind = "gated" | "gone" | "unverified" | "error"

interface SourceUnavailableProps {
  kind: SourceUnavailableKind
  registryName: string
  // The registry's site, through its referral link or tagged with UTM.
  visitHref: string
  onVisit: () => void
  categoryHref: string
  categoryLabel: string
  onRetry: () => void
  errorMessage?: string
  // The item's title or name.
  itemLabel: string
  // Secondary actions, such as a Preview of the author's demo.
  actions?: ReactNode
}

const ICONS = {
  gated: Lock,
  gone: FileX,
  unverified: Clock,
  error: RotateCw,
} as const

// Bars of varying length standing in for code: the shape of a file, never
// its content. Blurred behind the card, they say "the source would be here"
// without pretending to show any.
const PLACEHOLDER_LINES = [62, 38, 0, 74, 55, 81, 46, 0, 68, 33, 77, 52, 0, 59, 41, 70, 36, 64, 0, 48, 72, 29]

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

  const visit = (label: string, variant: "default" | "outline") => (
    <Button asChild size="sm" variant={variant}>
      <a href={visitHref} target="_blank" rel="noopener noreferrer" onClick={onVisit}>
        {label}
        <ArrowUpRight aria-hidden="true" />
      </a>
    </Button>
  )

  const content = {
    // Not an error: the item is offered under the registry's license, and
    // the way to it is one click away.
    gated: {
      title: `${itemLabel} is part of ${registryName}'s licensed catalog`,
      description: `Sign in or get a license at ${registryName} to see its source and install it.`,
      primary: visit(`Get access at ${registryName}`, "default"),
      secondary: null,
    },
    gone: {
      title: `${registryName} no longer serves ${itemLabel}`,
      description: `It's still listed in ${registryName}'s index, but asking for it returns nothing, so it can't be installed.`,
      primary: (
        <Button asChild size="sm">
          <Link href={categoryHref}>
            Other {categoryLabel.toLowerCase()} from {registryName}
          </Link>
        </Button>
      ),
      secondary: visit(`Visit ${registryName}`, "outline"),
    },
    unverified: {
      title: "Not checked yet",
      description: `${registryName} limits how often it can be asked, and ${itemLabel} hasn't had its turn. Its source will show here once it has.`,
      primary: visit(`Visit ${registryName}`, "default"),
      secondary: null,
    },
    error: {
      title: "Couldn't load the source",
      description: `${errorMessage ? `${errorMessage} ` : ""}The rest of this page comes from the directory's own catalog.`,
      primary: (
        <Button size="sm" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          Try again
        </Button>
      ),
      secondary: null,
    },
  }[kind]

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

      <div className="relative flex h-full items-center justify-center p-4">
        <section
          role="status"
          aria-labelledby="source-unavailable-title"
          className="w-full max-w-sm rounded-lg border border-border bg-background/95 p-6 text-center shadow-lg backdrop-blur-sm"
        >
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full border border-border bg-muted">
            <Icon className="size-4 text-foreground" aria-hidden="true" />
          </div>
          <h2
            id="source-unavailable-title"
            className="text-base font-medium text-foreground text-balance"
          >
            {content.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            {content.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {content.primary}
            {kind !== "error" && actions}
            {content.secondary}
          </div>
        </section>
      </div>
    </div>
  )
}
