import type { SemanticCategory } from "@/app/(app)/[owner]/[repo]/page"

interface TagsSectionProps {
  tags: SemanticCategory[]
}

export function TagsSection({ tags }: TagsSectionProps) {
  if (tags.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Tags
      </h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((cat) => (
          <span
            key={cat.name}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/50 px-2.5 py-1 text-xs text-foreground-secondary"
          >
            {cat.name}
            <span className="text-muted-foreground tabular-nums">
              {cat.count}
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}
