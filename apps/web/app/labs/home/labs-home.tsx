'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import {
  PRO_OFFERING_LABELS,
  REGISTRY_TYPE_LABELS,
  typeToSlug,
} from "@/lib/registry-mappings"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { WhatsNew } from "./whats-new"
import type { Collection, CollectionCard, CollectionsFile, ShippedEntry, ShippedFile } from "@/lib/registry-data"

// v0.4 — layout settled (stack), life settled (the shipped ticker, full-width
// with discrete steps). Data settled too: everything on this page comes from
// collections.json and shipped.json in Vercel Blob, fed by the local pipeline.

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function timeAgo(dateStr: string): string {
  // Calendar-day semantics: an entry dated yesterday reads "yesterday" the
  // moment midnight passes, regardless of elapsed hours.
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const parts = dateStr.split("-").map(Number)
  const entry = new Date(parts[0] ?? 0, (parts[1] ?? 1) - 1, parts[2] ?? 1)
  const days = Math.round((today.getTime() - entry.getTime()) / 86400000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Collection header — the criterion line is the signature: the query that
// produced the group, rendered as a specimen label.
// ---------------------------------------------------------------------------

function CollectionHeader({ collection }: { collection: Collection }) {
  return (
    <header className="flex flex-col gap-1.5">
      <h2 className="type-section text-balance">{collection.title}</h2>
      <p className="text-sm text-muted-foreground max-w-xl text-pretty">
        {collection.standfirst}
      </p>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Registry cards
// ---------------------------------------------------------------------------

function MetaRow({ registry }: { registry: CollectionCard }) {
  const parts: string[] = []
  if (registry.itemCount) parts.push(`${formatCount(registry.itemCount)} items`)
  // The indexer sends registry:* keys; the words live here.
  if (registry.types?.length) {
    parts.push(
      registry.types
        .map((type) => {
          const slug = typeToSlug(type)
          return (slug && REGISTRY_TYPE_LABELS[slug]) || type.replace("registry:", "")
        })
        .join(" · ")
    )
  }
  return (
    <div className="flex flex-col gap-1 type-meta text-muted-foreground">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{parts.join(" · ")}</span>
        {typeof registry.stars === "number" && (
          <span className="flex items-center gap-1 shrink-0">
            <Star className="size-3" aria-hidden="true" />
            {formatCount(registry.stars)}
          </span>
        )}
      </div>
      {registry.updated && (
        <span className="text-muted-foreground">{registry.updated}</span>
      )}
    </div>
  )
}

function ProChips({ registry }: { registry: CollectionCard }) {
  if (!registry.pro?.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {registry.pro.map((chip) => (
        <span
          key={chip}
          className="type-label text-muted-foreground border border-border-subtle px-1.5 py-0.5"
        >
          {PRO_OFFERING_LABELS[chip] ?? chip}
        </span>
      ))}
    </div>
  )
}

function RegistryCard({
  registry,
  lead = false,
}: {
  registry: CollectionCard
  lead?: boolean
}) {
  return (
    <Link
      href={registry.href}
      className={`group relative flex h-full flex-col justify-between gap-4 border border-border-subtle bg-background p-4 transition-colors hover:border-border focus-visible:outline-2 focus-visible:outline-ring ${
        lead ? "md:p-6" : ""
      }`}
    >
      {registry.sponsored && (
        <span className="absolute top-0 right-0 type-label text-muted-foreground bg-secondary border-b border-l border-border-subtle px-1.5 py-0.5">
          Sponsored
        </span>
      )}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Avatar className={lead ? "size-7" : "size-5"}>
            <AvatarImage src={registry.avatar} alt="" />
            <AvatarFallback className="bg-secondary text-muted-foreground text-[10px]">
              {registry.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span
            className={`font-semibold tracking-tight group-hover:underline underline-offset-4 ${
              lead ? "text-lg md:text-xl" : "text-sm"
            }`}
          >
            {registry.name}
          </span>
        </div>
        <p
          className={`text-muted-foreground ${
            lead ? "text-sm line-clamp-3" : "text-xs line-clamp-2"
          }`}
        >
          {registry.description}
        </p>
        {registry.evidence && (
          <code className="mt-1 type-label text-muted-foreground">
            {registry.evidence}
          </code>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ProChips registry={registry} />
        <MetaRow registry={registry} />
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// The settled layout — stack: editorial full-width sections, sticky header
// beside a lead-first card grid.
// ---------------------------------------------------------------------------

export function StackSections({ collections }: { collections: Collection[] }) {
  return (
    <div className="flex flex-col">
      {collections.map((collection) => (
        <section
          key={collection.slug}
          aria-label={collection.title}
          className="border-t border-border-subtle py-12 px-4 md:px-8"
        >
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
            <div className="md:sticky md:top-8 self-start">
              <CollectionHeader collection={collection} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* The first slot carries most of the position effect — give it
                  the visual weight to match, and let 5 members fill the grid. */}
              {collection.registries.map((registry, index) => (
                <div
                  key={registry.href}
                  className={index === 0 ? "sm:col-span-2" : undefined}
                >
                  <RegistryCard registry={registry} lead={index === 0} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Just shipped — full-width ticker over shipped.json. Discrete steps: the
// list rests, then advances one row. Pauses on hover and while the tab is
// hidden; static under prefers-reduced-motion.
// ---------------------------------------------------------------------------

const TICKER_ROW_PX = 56
const TICKER_VISIBLE = 5
const TICKER_STEP_MS = 2800
const TICKER_MASK =
  "linear-gradient(to bottom, transparent 0, black 28px, black calc(100% - 28px), transparent)"

function TickerRow({ entry }: { entry: ShippedEntry }) {
  return (
    <li
      className="flex items-center gap-3 border-b border-border-subtle"
      style={{ height: TICKER_ROW_PX }}
    >
      <Avatar className="size-6 shrink-0">
        <AvatarImage src={entry.avatar ?? undefined} alt="" />
        <AvatarFallback className="bg-secondary text-muted-foreground text-[10px]">
          {entry.registry.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate type-card">
            {entry.registry}
          </span>
          <span className="shrink-0 type-meta text-muted-foreground">
            +{entry.added.length} · {timeAgo(entry.date)}
          </span>
        </div>
        <p className="truncate type-meta text-muted-foreground">
          {/* A handful of names says what kind of thing shipped. The whole
              list said nothing and filled the row. */}
          {entry.added.slice(0, 4).join(" · ")}
          {entry.added.length > 4 ? ` · +${entry.added.length - 4} more` : ""}
        </p>
      </div>
    </li>
  )
}

function StepTicker({ entries }: { entries: ShippedEntry[] }) {
  const [offset, setOffset] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const scrollable = entries.length > TICKER_VISIBLE

  useEffect(() => {
    if (paused || reducedMotion || !scrollable) return
    const id = setInterval(() => {
      if (document.hidden) return
      setOffset((o) => o + 1)
    }, TICKER_STEP_MS)
    return () => clearInterval(id)
  }, [paused, reducedMotion, scrollable])

  // Seamless wrap: once past the last real row, snap back between two frames.
  useEffect(() => {
    if (offset < entries.length) return
    const t = setTimeout(() => {
      setAnimate(false)
      setOffset(0)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimate(true))
      )
    }, 750)
    return () => clearTimeout(t)
  }, [offset, entries.length])

  const rows = scrollable
    ? [...entries, ...entries.slice(0, TICKER_VISIBLE)]
    : entries

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: TICKER_ROW_PX * Math.min(TICKER_VISIBLE, entries.length),
        maskImage: scrollable ? TICKER_MASK : undefined,
        WebkitMaskImage: scrollable ? TICKER_MASK : undefined,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <ol
        className={animate ? "transition-transform duration-700" : ""}
        style={{
          transform: `translateY(-${offset * TICKER_ROW_PX}px)`,
          transitionTimingFunction: "cubic-bezier(0.77, 0, 0.175, 1)",
        }}
      >
        {rows.map((entry, index) => (
          <TickerRow
            key={`${index}-${entry.registry}-${entry.date}`}
            entry={entry}
          />
        ))}
      </ol>
    </div>
  )
}

export function JustShipped({ shipped }: { shipped: ShippedFile | null }) {
  const entries = shipped?.entries ?? []
  const totalShipped = entries.reduce((s, e) => s + e.added.length, 0)

  return (
    <section
      aria-label="Just shipped"
      className="border-t border-border-subtle py-12 px-4 md:px-8"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <header className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-4">
            <h2 className="type-section">
              Just shipped
            </h2>
          </div>
        </header>
        {entries.length > 0 ? (
          <StepTicker entries={entries} />
        ) : (
          <p className="font-mono text-xs text-muted-foreground border-b border-border-subtle pb-4">
            {shipped?.note ??
              "Nothing new detected yet — the diff fills in with the next ingestion run."}
          </p>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export function LabsHome({
  data,
  shipped,
}: {
  data: CollectionsFile | null
  shipped: ShippedFile | null
}) {
  const meta = data?.meta
  const collections = data?.collections ?? []

  return (
    <main className="min-h-screen pb-24">
      <header className="px-4 md:px-8 pt-10 pb-12 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="type-title">
              registry.directory
            </h1>
            <code className="type-label text-muted-foreground border border-border-subtle px-1.5 py-0.5">
              labs / collections v0.4
            </code>
          </div>
        </div>
        <p className="mt-6 text-sm font-mono text-muted-foreground max-w-lg">
          The shadcn registry ecosystem, read as collections. Every group states
          the criterion that formed it.
        </p>
        {meta && (
          <p className="mt-2 type-meta text-muted-foreground">
            snapshot {meta.date}
            {meta.indexesOk !== undefined &&
              meta.indexesTotal !== undefined &&
              ` · ${meta.indexesOk}/${meta.indexesTotal} indexes`}{" "}
            · {meta.totalItems.toLocaleString("en-US")} items measured
          </p>
        )}
        {/* Retrieval keeps a first-class, always-visible home: collections
            compete with browsing, never with finding a known name. In this lab
            it opens the live home search; the real page wires it in place. */}
        <Link
          href="/?tab=components"
          className="mt-6 flex max-w-lg items-center justify-between gap-3 border border-border-subtle bg-secondary/30 px-3 py-2.5 transition-colors hover:border-border focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span className="font-mono text-xs text-muted-foreground">
            Search{meta ? ` ${meta.totalItems.toLocaleString("en-US")}` : ""} items
            {meta?.indexesOk ? ` across ${meta.indexesOk} registries` : ""}…
          </span>
          <kbd className="type-label text-muted-foreground border border-border-subtle px-1.5 py-0.5">
            P
          </kbd>
        </Link>
      </header>

      <JustShipped shipped={shipped} />

      <WhatsNew shipped={shipped} />

      {collections.length === 0 ? (
        <p className="px-4 md:px-8 py-12 border-t border-border-subtle font-mono text-sm text-muted-foreground">
          Collections unavailable — run `pnpm ingest && pnpm generate` from
          apps/web to fill the blobs this page reads.
        </p>
      ) : (
        <StackSections collections={collections} />
      )}
    </main>
  )
}
