'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { CENSUS_META, type LabCollection, type LabRegistryCard } from "./collections-data"

type Variant = "rails" | "bento" | "stack"

const VARIANTS: { id: Variant; label: string; key: string }[] = [
  { id: "rails", label: "Rails", key: "1" },
  { id: "bento", label: "Bento", key: "2" },
  { id: "stack", label: "Stack", key: "3" },
]

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ---------------------------------------------------------------------------
// Collection header — shared across variants. The criterion line is the
// signature: the query that produced the group, rendered as a specimen label.
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

function MetaRow({ registry }: { registry: LabRegistryCard }) {
  const parts: string[] = []
  if (registry.itemCount) parts.push(`${formatCount(registry.itemCount)} items`)
  if (registry.types?.length) parts.push(registry.types.join(" · "))
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
        <span className="text-muted-foreground">{registry.updated}</span>
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
}: {
  registry: LabRegistryCard
  lead?: boolean
  showEvidence?: boolean
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
        <MetaRow registry={registry} />
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Variant A — Rails: one horizontal scroll row per collection
// ---------------------------------------------------------------------------

function RailsVariant({ collections }: { collections: LabCollection[] }) {
  return (
    <div className="flex flex-col gap-14">
      {collections.map((collection) => (
        <section key={collection.slug} aria-label={collection.title}>
          <div className="px-4 md:px-8">
            <CollectionHeader collection={collection} />
          </div>
          <div className="mt-4 overflow-x-auto pb-2">
            <div className="flex gap-3 px-4 md:px-8 w-max">
              {collection.registries.map((registry) => (
                <div key={registry.href} className="w-[270px] shrink-0">
                  <RegistryCard registry={registry} />
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
// Variant B — Bento: lead card + supporting cards per collection
// ---------------------------------------------------------------------------

function BentoVariant({ collections }: { collections: LabCollection[] }) {
  return (
    <div className="flex flex-col gap-16 px-4 md:px-8 max-w-6xl mx-auto w-full">
      {collections.map((collection, index) => {
        const [lead, ...rest] = collection.registries
        const flipped = index % 2 === 1
        return (
          <section key={collection.slug} aria-label={collection.title}>
            <CollectionHeader collection={collection} />
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 md:grid-flow-dense gap-3">
              {lead && (
                <div
                  className={`md:row-span-2 md:row-start-1 ${
                    flipped ? "md:col-start-3" : "md:col-start-1"
                  }`}
                >
                  <RegistryCard registry={lead} lead showEvidence />
                </div>
              )}
              {rest.slice(0, 4).map((registry) => (
                <RegistryCard key={registry.href} registry={registry} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Variant C — Stack: editorial full-width sections, header beside the cards
// ---------------------------------------------------------------------------

function StackVariant({ collections }: { collections: LabCollection[] }) {
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
// Shell
// ---------------------------------------------------------------------------

export function LabsHome({ collections }: { collections: LabCollection[] }) {
  const [variant, setVariant] = useState<Variant>("stack")

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return
      const match = VARIANTS.find((v) => v.key === event.key)
      if (match) setVariant(match.id)
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
              labs / collections
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

      {collections.length === 0 ? (
        <p className="px-4 md:px-8 font-mono text-sm text-muted-foreground">
          No collections in the snapshot yet.
        </p>
      ) : variant === "rails" ? (
        <RailsVariant collections={collections} />
      ) : variant === "bento" ? (
        <BentoVariant collections={collections} />
      ) : (
        <StackVariant collections={collections} />
      )}

      <div
        role="group"
        aria-label="Layout variant"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex border border-border-subtle bg-background shadow-lg"
      >
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVariant(v.id)}
            aria-pressed={variant === v.id}
            className={`px-4 py-2 text-xs font-mono transition-[color,background-color,scale] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-ring ${
              variant === v.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v.label}
            <span className="ml-1.5 opacity-50">{v.key}</span>
          </button>
        ))}
      </div>
    </main>
  )
}
