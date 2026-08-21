import type { ReactNode } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import type { ShippedEntry, ShippedFile } from "@/lib/registry-data"

// What's new — a changelog wall over shipped.json: one cell per registry that
// added items inside the rolling window. Sits directly below the Just shipped
// ticker: the ticker lists every entry, the wall features the biggest ones.
// Monochrome on purpose: the page reserves color for meaning it already has
// (computed/curated dots).

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

// The featured cell takes two columns, so the wall closes its frame only at
// a count that leaves no gap: eight cells fill three rows of three, and four
// rows of two. Older entries are drawn on when the window is quiet — they
// carry their own dates and claim nothing about today.
const GRID_MAX = 8

type UpdateCell = {
  key: string
  /** The registry — what the cell is about. */
  registry: string
  avatar: string | null
  date: string
  /** The date this was measured against, when it is not the day before. */
  since: string | null
  count: number
  summary: string
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

function dayBefore(iso: string): string {
  const d = new Date(`${iso}T00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function buildCells(shipped: ShippedFile | null): UpdateCell[] {
  const entries = [...(shipped?.entries ?? [])].sort(
    (a, b) => b.added.length - a.added.length || b.date.localeCompare(a.date)
  )
  return entries.slice(0, GRID_MAX).map((entry: ShippedEntry) => ({
    key: `${entry.registry}-${entry.date}`,
    registry: entry.registry,
    avatar: entry.avatar,
    date: entry.date,
    // Only worth showing when the gap is wider than a day: otherwise the
    // cell would imply that six days of work happened in one.
    since: entry.since && entry.since !== dayBefore(entry.date) ? entry.since : null,
    count: entry.added.length,
    summary: summarize(entry.added),
    detail: entry.added.join(", "),
    href: entry.href ?? undefined,
  }))
}

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

/** The registry, which is what the cell is about. */
function Masthead({ cell, size }: { cell: UpdateCell; size: "lead" | "row" }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar className={size === "lead" ? "size-9 shrink-0" : "size-6 shrink-0"}>
        {cell.avatar && <AvatarImage src={cell.avatar} alt="" />}
        <AvatarFallback className="bg-secondary text-muted-foreground type-label">
          {cell.registry.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <h3 className={`${size === "lead" ? "type-section" : "type-title"} text-balance`}>
        {cell.registry}
      </h3>
    </div>
  )
}

/** When it shipped, and what that measurement covers. */
function When({ cell, long }: { cell: UpdateCell; long: boolean }) {
  return (
    <span className="type-meta text-muted-foreground">
      {formatDate(cell.date, long)}
    </span>
  )
}

// The whole cell is the link, so the affordance renders only when one exists.
function ViewLink({ cell }: { cell: UpdateCell }) {
  if (!cell.href) return null
  return (
    <span className="mt-auto pt-6 type-meta text-muted-foreground group-hover:text-foreground group-hover:underline underline-offset-4">
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
        <When cell={cell} long />
      </div>
      <div className="relative mt-5">
        <Masthead cell={cell} size="lead" />
      </div>
      <p className="relative mt-4 type-card text-foreground-secondary">
        {cell.count} new component{cell.count === 1 ? "" : "s"}
      </p>
      <p className="relative mt-2 font-mono text-xs text-muted-foreground line-clamp-3">
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
        <When cell={cell} long={false} />
      </div>
      <div className="mt-4">
        <Masthead cell={cell} size="row" />
      </div>
      <p className="mt-3 type-card text-foreground-secondary">
        {cell.count} new component{cell.count === 1 ? "" : "s"}
      </p>
      <p className="mt-1.5 font-mono text-xs text-muted-foreground line-clamp-2">
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

export function WhatsNew({ shipped }: { shipped: ShippedFile | null }) {
  const cells = buildCells(shipped)
  const featured = cells[0]
  const rest = cells.slice(1)

  // The ticker above already narrates the empty window; an empty wall adds
  // nothing, so the whole group stays out of the page.
  if (!featured) return null

  return (
    <section
      aria-label="This week"
      className="border-t border-border-subtle py-12 px-4 md:px-8"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {"This week"}
            </h2>
            <p className="text-sm text-muted-foreground text-pretty">
              The registries that shipped something in the last seven days.
            </p>
          </div>
        </header>
        <div className="relative">
          {/* Hairlines are shared: the frame draws top and left, every cell
              draws its own right and bottom. Columns follow the cell count
              so a young window still closes its frame. */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${
              cells.length >= 3 ? "lg:grid-cols-3" : ""
            } border-t border-l border-border-subtle`}
          >
            <FeaturedCell cell={featured} span={cells.length >= 3} />
            {rest.map((cell) => (
              <UpdateCellView key={cell.key} cell={cell} />
            ))}
          </div>
          <RegistrationMarks />
        </div>
      </div>
    </section>
  )
}
