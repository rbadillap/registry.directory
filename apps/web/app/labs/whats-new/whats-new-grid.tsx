import type { ReactNode } from "react"
import Link from "next/link"
import type { CollectionsFile, ShippedEntry, ShippedFile } from "../home/types"

// A changelog wall over shipped.json: one cell per registry that added items
// inside the rolling window. Accent is chart-3 — amber in the dark theme the
// site defaults to, and the only chart token the labs pages had left free
// (chart-2 and chart-4 already mean computed/curated on labs/home).

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

// The featured cell spans two rows, so five cells close the frame exactly at
// both md (2 columns) and lg (3 columns) — no ragged edge, no empty slot.
const GRID_CELLS = 5

type UpdateCell = {
  key: string
  /** registry name; "specimen" on filler cells */
  tag: string
  /** ISO date, or null on a specimen — the only marker of filler */
  date: string | null
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

function toCell(entry: ShippedEntry, hrefs: Map<string, string>): UpdateCell {
  return {
    key: `${entry.registry}-${entry.date}`,
    tag: entry.registry,
    date: entry.date,
    title: summarize(entry.added),
    detail: entry.added.join(", "),
    href: hrefs.get(entry.registry.toLowerCase()),
  }
}

// Filler, never presentable as shipping data: no date, no link, tag reads
// SPECIMEN in muted grey instead of the accent.
const SPECIMENS: UpdateCell[] = [
  {
    key: "specimen-1",
    tag: "specimen",
    date: null,
    title: "sidebar-07 + 2 companion items",
    detail: "sidebar-07, sidebar-07-inset, sidebar-07-mobile",
  },
  {
    key: "specimen-2",
    tag: "specimen",
    date: null,
    title: "toolbar ships in 3 variants",
    detail: "toolbar-default, toolbar-compact, toolbar-floating",
  },
  {
    key: "specimen-3",
    tag: "specimen",
    date: null,
    title: "5 new components",
    detail: "kbd, kbd-group, marquee, spinner-ring, tree-view",
  },
  {
    key: "specimen-4",
    tag: "specimen",
    date: null,
    title: "data-table + 4 companion items",
    detail:
      "data-table, data-table-column-header, data-table-faceted-filter, data-table-pagination, data-table-toolbar",
  },
]

function buildCells(
  shipped: ShippedFile | null,
  collections: CollectionsFile | null
): UpdateCell[] {
  const hrefs = registryHrefs(collections)
  const entries = [...(shipped?.entries ?? [])].sort(
    (a, b) => b.added.length - a.added.length || b.date.localeCompare(a.date)
  )
  const real = entries.map((entry) => toCell(entry, hrefs))
  if (real.length >= GRID_CELLS) return real
  return [...real, ...SPECIMENS.slice(0, GRID_CELLS - real.length)]
}

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

function Tag({ cell }: { cell: UpdateCell }) {
  return (
    <span
      className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] ${
        cell.date === null ? "text-muted-foreground" : "text-chart-3"
      }`}
    >
      {cell.tag}
    </span>
  )
}

function ReadLink({ cell, label }: { cell: UpdateCell; label: string }) {
  return (
    <span
      className={`mt-auto pt-6 font-mono text-[11px] ${
        cell.href
          ? "text-chart-3 group-hover:underline underline-offset-4"
          : "text-muted-foreground"
      }`}
    >
      {label} →
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

function FeaturedCell({ cell }: { cell: UpdateCell }) {
  return (
    <CellFrame
      href={cell.href}
      className="overflow-hidden min-h-[16rem] md:row-span-2 md:min-h-[26rem]"
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
        <span className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${
              cell.date === null ? "bg-foreground-faint" : "bg-chart-3"
            }`}
          />
          {cell.date === null ? "specimen" : formatDate(cell.date, true)}
        </span>
        <Tag cell={cell} />
      </div>
      <h3 className="relative mt-6 text-2xl md:text-3xl font-semibold tracking-tight text-balance">
        {cell.title}
      </h3>
      <p className="relative mt-3 font-mono text-xs text-muted-foreground line-clamp-4">
        {cell.detail}
      </p>
      <ReadLink cell={cell} label="Read update" />
    </CellFrame>
  )
}

function UpdateCellView({ cell }: { cell: UpdateCell }) {
  return (
    <CellFrame href={cell.href} className="min-h-[13rem]">
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-[11px] text-muted-foreground">
          {cell.date === null ? "specimen" : formatDate(cell.date, false)}
        </span>
        <Tag cell={cell} />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight line-clamp-2">
        {cell.title}
      </h3>
      <p className="mt-2 font-mono text-xs text-muted-foreground line-clamp-3">
        {cell.detail}
      </p>
      <ReadLink cell={cell} label="Read more" />
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
// Page
// ---------------------------------------------------------------------------

export function WhatsNewGrid({
  collections,
  shipped,
}: {
  collections: CollectionsFile | null
  shipped: ShippedFile | null
}) {
  const cells = buildCells(shipped, collections)
  const featured = cells[0]
  const rest = cells.slice(1)
  const padded = cells.some((cell) => cell.date === null)

  return (
    <main className="min-h-screen px-4 md:px-8 py-10 pb-24">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold tracking-tight">
            registry.directory
          </span>
          <code className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border-subtle px-1.5 py-0.5">
            {"labs / what's new"}
          </code>
        </div>

        <section aria-label="What's new" className="flex flex-col gap-6">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                {"What's new"}
              </h1>
              <p className="text-sm text-muted-foreground text-pretty">
                The latest components shipping across the shadcn ecosystem.
              </p>
            </div>
            <Link
              href="/labs/home"
              className="font-mono text-xs text-chart-3 hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            >
              View all →
            </Link>
          </header>

          <div className="relative">
            {/* Hairlines are shared: the frame draws top and left, every cell
                draws its own right and bottom. */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-border-subtle">
              {featured && <FeaturedCell cell={featured} />}
              {rest.map((cell) => (
                <UpdateCellView key={cell.key} cell={cell} />
              ))}
            </div>
            <RegistrationMarks />
          </div>

          {padded && (
            <p className="font-mono text-[11px] text-muted-foreground">
              Specimen cells pad the grid while the snapshot history is young.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
