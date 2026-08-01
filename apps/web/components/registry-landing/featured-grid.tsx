import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { RegistryItem } from "@/lib/registry-types"

interface FeaturedGridProps {
  items: RegistryItem[]
  basePath: string
}

function typeBadge(type: string | undefined): string {
  if (!type) return "item"
  return type.replace(/^registry:/, "")
}

export function FeaturedGrid({ items, basePath }: FeaturedGridProps) {
  return (
    <section className="space-y-4">
      <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Featured
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.name}
            href={`${basePath}/${item.name}`}
            className="group"
          >
            <div className="flex h-full flex-col gap-2 rounded-lg border border-border bg-surface/40 p-[18px] transition-colors hover:bg-accent">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                  {typeBadge(item.type)}
                </span>
                <ArrowUpRight
                  className="h-[13px] w-[13px] text-foreground-faint transition-colors group-hover:text-foreground"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-[15px] font-semibold leading-snug text-foreground">
                {item.name}
              </h3>
              {item.description && (
                <p className="text-[13px] leading-5 text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
