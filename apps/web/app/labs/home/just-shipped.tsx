import type { ReactNode } from "react"
import Link from "next/link"
import type { CollectionsFile, ShippedEntry, ShippedFile } from "./types"

// Just shipped — a changelog wall over shipped.json: one cell per registry
// that added items inside the rolling window. Monochrome on purpose: the page
// reserves color for meaning it already has (computed/curated dots).

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

// The featured cell spans two rows from md up, so seven cells close the frame
// exactly at both md (2 columns) and lg (3 columns).
const GRID_MAX = 7

type UpdateCell = {
  key: string
  tag: string
  date: string
  title: string
  detail: string
  href?: string
}

function formatDate(iso: string, long: boolean): string {
  const parts = iso.split("-").map(Number)
  const month = MONTHS[(parts[1] ?? 1) - 1] ?? ""
  const day = parts[2] ?? 1
  return long ? `${month} ${day}, ${parts[0] ?? ""}` : `${month} ${day}`
}

function commonPrefix(names: string[]): string {
  let prefix = names[0] ?? ""
  for (const name of names.slice(1)) {
    let i = 0
    while (i < prefix.length && i < name.length && prefix[i] === name[i]) i++
    prefix = prefix.slice(0, i)
  }
  return prefix
}

// Deterministic title. The shared stem of the added names is the only claim
// made — nothing here describes what a component does.
function summarize(added: string[]): string {
  const only = added[0]
  if (!only) return "No new components"
  if (added.length === 1) return only

  const prefix = commonPrefix(added)
  if (added.includes(prefix)) {
    const companions = added.length - 1
    return `${prefix} + ${companions} companion item${companions === 1 ? "" : "s"}`
  }

  // A separator boundary proves the stem is a name and not a coincidence
  // ("card"/"carousel" share "car" and must not collapse).
  const stem = prefix.replace(/[-_./ ]+$/, "")
  if (stem.length >= 3 && stem.length < prefix.length) {
    return `${stem} ships in ${added.length} variants`
  }

  return `${added.length} new components`
}

function registryHrefs(collections: CollectionsFile | null): Map<string, string> {
  const hrefs = new Map<string, string>()
  for (const collection of collections?.collections ?? []) {
    for (const registry of collection.registries) {
      const key = registry.name.toLowerCase()
      if (!hrefs.has(key)) hrefs.set(key, registry.href)
    }
  }
  return hrefs
}

function buildCells(
  shipped: ShippedFile | null,
  collections: CollectionsFile | null
): UpdateCell[] {
  const hrefs = registryHrefs(collections)
  const entries = [...(shipped?.entries ?? [])].sort(
    (a, b) => b.added.length - a.added.length || b.date.localeCompare(a.date)
  )
  return entries.slice(0, GRID_MAX).map((entry: ShippedEntry) => ({
    key: `${entry.registry}-${entry.date}`,
    tag: entry.registry,
    date: entry.date,
    title: summarize(entry.added),
    detail: entry.added.join(", "),
    href: hrefs.get(entry.registry.toLowerCase()),
  }))
}

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

function Tag({ cell }: { cell: UpdateCell }) {
  return (
    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
      {cell.tag}
    </span>
  )
}

// The whole cell is the link, so the affordance renders only when one exists.
function ViewLink({ cell }: { cell: UpdateCell }) {
  if (!cell.href) return null
  return (
    <span className="mt-auto pt-6 font-mono text-[11px] text-muted-foreground group-hover:text-foreground group-hover:underline underline-offset-4">
      View registry →
    </span>
  )
}

function CellFrame({
  href,
  className,
  children,
}: {
  href?: string
  className: string
  children: ReactNode
}) {
  const shared = `group relative flex flex-col border-r border-b border-border-subtle bg-background p-6 ${className}`
  if (!href) return <div className={shared}>{children}</div>
  return (
    <Link
      href={href}
      className={`${shared} transition-colors hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-ring`}
    >
      {children}
    </Link>
  )
}

function FeaturedCell({ cell, span }: { cell: UpdateCell; span: boolean }) {
  return (
    <CellFrame
      href={cell.href}
      className={`overflow-hidden min-h-[16rem] ${
        span ? "md:row-span-2 md:min-h-[26rem]" : ""
      }`}
    >
      {/* Texture, not decoration: the dots sit under the lower half only. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-border-subtle) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
          maskImage: "linear-gradient(to bottom, transparent, black 70%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 70%)",
        }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <span className="font-mono text-[11px] text-muted-foreground">
          {formatDate(cell.date, true)}
        </span>
        <Tag cell={cell} />
      </div>
      <h3 className="relative mt-6 text-2xl md:text-3xl font-semibold tracking-tight text-balance">
        {cell.title}
      </h3>
      <p className="relative mt-3 font-mono text-xs text-muted-foreground line-clamp-4">
        {cell.detail}
      </p>
      <ViewLink cell={cell} />
    </CellFrame>
  )
}

function UpdateCellView({ cell }: { cell: UpdateCell }) {
  return (
    <CellFrame href={cell.href} className="min-h-[13rem]">
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-[11px] text-muted-foreground">
          {formatDate(cell.date, false)}
        </span>
        <Tag cell={cell} />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight line-clamp-2">
        {cell.title}
      </h3>
      <p className="mt-2 font-mono text-xs text-muted-foreground line-clamp-3">
        {cell.detail}
      </p>
      <ViewLink cell={cell} />
    </CellFrame>
  )
}

// Print registration marks: hollow squares straddling the four corners of the
// frame. Half of each square hangs outside the grid.
function RegistrationMarks() {
  const corners = [
    "-top-[3.5px] -left-[3.5px]",
    "-top-[3.5px] -right-[3.5px]",
    "-bottom-[3.5px] -left-[3.5px]",
    "-bottom-[3.5px] -right-[3.5px]",
  ]
  return (
    <>
      {corners.map((position) => (
        <span
          key={position}
          aria-hidden="true"
          className={`pointer-events-none absolute size-[7px] border border-foreground-subtle bg-background ${position}`}
        />
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function JustShipped({
  shipped,
  collections,
}: {
  shipped: ShippedFile | null
  collections: CollectionsFile | null
}) {
  const cells = buildCells(shipped, collections)
  const featured = cells[0]
  const rest = cells.slice(1)
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
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Just shipped
            </h2>
            {entries.length > 0 && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {totalShipped} new items across {entries.length} registries
              </span>
            )}
          </div>
          <code className="text-[11px] font-mono text-muted-foreground border border-border-subtle bg-secondary/40 px-2 py-1">
            diff(registry.json) · rolling {shipped?.windowDays ?? 1}d window
          </code>
        </header>
        {featured ? (
          <div className="relative">
            {/* Hairlines are shared: the frame draws top and left, every cell
                draws its own right and bottom. Columns follow the cell count
                so a young window still closes its frame. */}
            <div
              className={`grid grid-cols-1 md:grid-cols-2 ${
                cells.length >= 3 ? "lg:grid-cols-3" : ""
              } border-t border-l border-border-subtle`}
            >
              <FeaturedCell cell={featured} span={cells.length >= 4} />
              {rest.map((cell) => (
                <UpdateCellView key={cell.key} cell={cell} />
              ))}
            </div>
            <RegistrationMarks />
          </div>
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
