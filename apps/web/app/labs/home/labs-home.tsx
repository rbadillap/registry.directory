'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  CENSUS_META,
  PULSE,
  ROTATION,
  type LabCollection,
  type LabRegistryCard,
} from "./collections-data"
import { JOURNAL, JOURNAL_MARKS } from "./journal-data"

// v0.2 — the layout is settled (stack); the tabs now compare three proposals
// for giving the portal life: pulse (visible metabolism), rotation (a page
// that differs every day), journal (the directory keeps its own log).
type Proposal = "pulse" | "rotation" | "journal"

const PROPOSALS: { id: Proposal; label: string; key: string }[] = [
  { id: "pulse", label: "Pulse", key: "1" },
  { id: "rotation", label: "Rotation", key: "2" },
  { id: "journal", label: "Journal", key: "3" },
]

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ---------------------------------------------------------------------------
// Collection header — the criterion line is the signature: the query that
// produced the group, rendered as a specimen label.
// ---------------------------------------------------------------------------

function CollectionHeader({
  collection,
  size = "base",
}: {
  collection: LabCollection
  size?: "base" | "lg"
}) {
  return (
    <header className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-3">
        <h2
          className={
            size === "lg"
              ? "text-2xl md:text-3xl font-semibold tracking-tight text-balance"
              : "text-xl md:text-2xl font-semibold tracking-tight text-balance"
          }
        >
          {collection.title}
        </h2>
        <span
          aria-hidden="true"
          className={`mt-1 size-1.5 rounded-full ${
            collection.kind === "computed" ? "bg-chart-2" : "bg-chart-4"
          }`}
        />
        <span className="sr-only">
          {collection.kind === "computed" ? "computed collection" : "curated collection"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-xl text-pretty">{collection.standfirst}</p>
      <code className="mt-1 w-fit text-[11px] font-mono text-muted-foreground border border-border-subtle bg-secondary/40 px-2 py-1">
        {collection.criterion}
      </code>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

function MetaRow({
  registry,
  pulse = false,
}: {
  registry: LabRegistryCard
  pulse?: boolean
}) {
  const parts: string[] = []
  if (registry.itemCount) parts.push(`${formatCount(registry.itemCount)} items`)
  if (registry.types?.length) parts.push(registry.types.join(" · "))
  const fresh = pulse && registry.updatedDays !== undefined && registry.updatedDays <= 7
  const quiet = pulse && registry.updatedDays !== undefined && registry.updatedDays >= 180
  return (
    <div className="flex flex-col gap-1 font-mono text-[11px] text-muted-foreground">
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
        <span className="flex items-center gap-1.5">
          {fresh && (
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-chart-2 motion-safe:animate-pulse"
            />
          )}
          <span className={fresh ? "text-chart-2" : "text-muted-foreground"}>
            {registry.updated}
          </span>
          {quiet && (
            <span className="border border-border-subtle px-1 py-px text-[10px] uppercase tracking-wider">
              quiet
            </span>
          )}
        </span>
      )}
    </div>
  )
}

function ProChips({ registry }: { registry: LabRegistryCard }) {
  if (!registry.pro?.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {registry.pro.map((chip) => (
        <span
          key={chip}
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border-subtle px-1.5 py-0.5"
        >
          {chip}
        </span>
      ))}
    </div>
  )
}

function RegistryCard({
  registry,
  lead = false,
  showEvidence = false,
  pulse = false,
}: {
  registry: LabRegistryCard
  lead?: boolean
  showEvidence?: boolean
  pulse?: boolean
}) {
  return (
    <Link
      href={registry.href}
      className={`group relative flex h-full flex-col justify-between gap-4 border border-border-subtle bg-background p-4 transition-colors hover:border-border focus-visible:outline-2 focus-visible:outline-ring ${
        lead ? "md:p-6" : ""
      }`}
    >
      {registry.sponsored && (
        <span className="absolute top-0 right-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary border-b border-l border-border-subtle px-1.5 py-0.5">
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
        {showEvidence && registry.evidence && (
          <code className="mt-1 font-mono text-[10px] text-muted-foreground">
            {registry.evidence}
          </code>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ProChips registry={registry} />
        <MetaRow registry={registry} pulse={pulse} />
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// The settled layout — stack: editorial full-width sections, sticky header
// beside a lead-first card grid.
// ---------------------------------------------------------------------------

function StackVariant({
  collections,
  pulse = false,
}: {
  collections: LabCollection[]
  pulse?: boolean
}) {
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
              <CollectionHeader collection={collection} size="lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* The first slot carries most of the position effect — give it
                  the visual weight to match, and let 5 members fill the grid. */}
              {collection.registries.map((registry, index) => (
                <div
                  key={registry.href}
                  className={index === 0 ? "sm:col-span-2" : undefined}
                >
                  <RegistryCard
                    registry={registry}
                    lead={index === 0}
                    showEvidence
                    pulse={pulse}
                  />
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
// Proposal 2 — Rotation: a page that is different every day. The pick is
// seeded by the date, so the existing daily rebuild rotates it for free.
// ---------------------------------------------------------------------------

function TodayHero() {
  return (
    <section
      aria-label="Registry of the day"
      className="border-t border-border-subtle py-12 px-4 md:px-8"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Registry of the day
          </h2>
          <code className="font-mono text-[11px] text-muted-foreground">
            {ROTATION.date}
          </code>
        </div>
        <RegistryCard registry={ROTATION.today} lead showEvidence />
        <p className="font-mono text-[11px] text-muted-foreground">
          tomorrow: {ROTATION.tomorrow} · {ROTATION.coverageNote} · rotated by
          the daily rebuild, no infrastructure added
        </p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Proposal 3 — Journal: the directory keeps its own log. Admissions, health,
// census — the organism's memory, visible.
// ---------------------------------------------------------------------------

function JournalSection() {
  return (
    <section
      aria-label="Journal"
      className="border-t border-border-subtle py-12 px-4 md:px-8"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
        <div className="md:sticky md:top-8 self-start">
          <header className="flex flex-col gap-1.5">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Journal
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl text-pretty">
              The directory keeps its own log — admissions, health probes,
              census runs. Not a feed: a lab notebook.
            </p>
            <code className="mt-1 w-fit text-[11px] font-mono text-muted-foreground border border-border-subtle bg-secondary/40 px-2 py-1">
              every line emitted by the system that caused it
            </code>
          </header>
        </div>
        <ol className="flex flex-col">
          {JOURNAL.map((entry) => (
            <li
              key={`${entry.date}-${entry.kind}-${entry.text.slice(0, 16)}`}
              className="flex gap-3 border-b border-border-subtle py-3 font-mono text-xs"
            >
              <span className="shrink-0 text-muted-foreground">{entry.date}</span>
              <span aria-hidden="true" className="shrink-0 w-3 text-foreground font-semibold">
                {JOURNAL_MARKS[entry.kind]}
              </span>
              <span className="sr-only">{entry.kind}:</span>
              <span className="text-foreground/90">{entry.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export function LabsHome({ collections }: { collections: LabCollection[] }) {
  const [proposal, setProposal] = useState<Proposal>("pulse")

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return
      const match = PROPOSALS.find((p) => p.key === event.key)
      if (match) setProposal(match.id)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <main className="min-h-screen pb-24">
      <header className="px-4 md:px-8 pt-10 pb-12 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              registry.directory
            </h1>
            <code className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border-subtle px-1.5 py-0.5">
              labs / collections v0.2
            </code>
          </div>
        </div>
        <p className="mt-6 text-sm font-mono text-muted-foreground max-w-lg">
          The shadcn registry ecosystem, read as collections. Every group states
          the criterion that formed it.
        </p>
        <p className="mt-2 text-[11px] font-mono text-muted-foreground">
          census {CENSUS_META.date} · {CENSUS_META.indexesOk}/
          {CENSUS_META.indexesTotal} indexes ·{" "}
          {CENSUS_META.totalItems.toLocaleString("en-US")} items measured
        </p>
        {proposal === "pulse" && (
          <p className="mt-1 text-[11px] font-mono text-chart-2">
            pulse: {PULSE.today} pushed today · {PULSE.thisWeek} this week ·{" "}
            {PULSE.thisMonth} this month · {PULSE.quiet} quiet 6mo+ · of{" "}
            {PULSE.measured} measured
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
            Search {CENSUS_META.totalItems.toLocaleString("en-US")} items across{" "}
            {CENSUS_META.indexesOk} registries…
          </span>
          <kbd className="font-mono text-[10px] uppercase text-muted-foreground border border-border-subtle px-1.5 py-0.5">
            P
          </kbd>
        </Link>
        <div className="mt-4 flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" /> computed
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-4" /> curated
          </span>
        </div>
      </header>

      {proposal === "rotation" && <TodayHero />}
      {proposal === "journal" && <JournalSection />}

      {collections.length === 0 ? (
        <p className="px-4 md:px-8 font-mono text-sm text-muted-foreground">
          No collections in the snapshot yet.
        </p>
      ) : (
        <StackVariant collections={collections} pulse={proposal === "pulse"} />
      )}

      <div
        role="group"
        aria-label="Life proposal"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex border border-border-subtle bg-background shadow-lg"
      >
        {PROPOSALS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProposal(p.id)}
            aria-pressed={proposal === p.id}
            className={`px-4 py-2 text-xs font-mono transition-[color,background-color,scale] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-ring ${
              proposal === p.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
            <span className="ml-1.5 opacity-50">{p.key}</span>
          </button>
        ))}
      </div>
    </main>
  )
}
