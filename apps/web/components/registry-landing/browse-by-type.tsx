import Link from "next/link"
import { Package } from "lucide-react"
import {
  REGISTRY_TYPE_ICONS,
  REGISTRY_TYPE_LABELS,
  sortByTypeRelevance,
} from "@/lib/registry-mappings"
import type { RegistryItem } from "@/lib/registry-types"

interface BrowseByTypeProps {
  categories: Map<string, RegistryItem[]>
  basePath: string
}

export function BrowseByType({ categories, basePath }: BrowseByTypeProps) {
  const sortedSlugs = sortByTypeRelevance(
    Array.from(categories.keys()).filter(
      (slug) => categories.get(slug)!.length > 0
    )
  )

  if (sortedSlugs.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Browse by type
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {sortedSlugs.map((slug) => {
          const items = categories.get(slug)!
          const Icon = REGISTRY_TYPE_ICONS[slug] || Package
          const label = REGISTRY_TYPE_LABELS[slug] || slug

          return (
            <Link
              key={slug}
              href={`${basePath}/${slug}`}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3.5 transition-colors hover:bg-accent"
            >
              <Icon
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
