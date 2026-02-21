import Link from "next/link"
import { ExternalLink, Star } from "lucide-react"
import { Package } from "lucide-react"
import { GitHubIcon } from "@/components/icons/github"
import { ViewerHeader } from "./viewer/viewer-header"
import { StatusBar } from "./viewer/status-bar"
import {
  REGISTRY_TYPE_LABELS,
  REGISTRY_TYPE_ICONS,
  sortByTypeRelevance,
} from "@/lib/registry-mappings"
import { formatStars, formatRelativeTime } from "@/lib/format-utils"
import { addUtmParams } from "@/lib/utm-utils"
import type { RegistryItem } from "@/lib/registry-types"
import type { DirectoryEntry } from "@/lib/types"
import type { SemanticCategory } from "@/app/(app)/[owner]/[repo]/page"

interface RegistryOverviewProps {
  registry: DirectoryEntry
  categories: Map<string, RegistryItem[]>
  owner: string
  repo: string
  githubStats?: { stars: number; lastCommit: string } | null
  semanticCategories?: SemanticCategory[]
}

export function RegistryOverview({
  registry,
  categories,
  owner,
  repo,
  githubStats,
  semanticCategories = [],
}: RegistryOverviewProps) {
  const totalItems = Array.from(categories.values()).reduce(
    (sum, items) => sum + items.length,
    0
  )
  const sortedSlugs = sortByTypeRelevance(
    Array.from(categories.keys()).filter(
      (slug) => categories.get(slug)!.length > 0
    )
  )

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <ViewerHeader registry={registry} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">
          {/* Registry Header */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              {registry.github_profile && (
                <img
                  src={registry.github_profile}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-full flex-shrink-0"
                  loading="eager"
                />
              )}
              <h1 className="text-xl md:text-2xl font-semibold text-foreground text-pretty">
                {registry.name}
              </h1>
            </div>
            {registry.description && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
                {registry.description}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-muted-foreground">
              <span className="tabular-nums">
                {categories.size} {categories.size === 1 ? "type" : "types"}
              </span>
              <span className="text-foreground-faint" aria-hidden="true">
                ·
              </span>
              <span className="tabular-nums">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
              {githubStats && (
                <>
                  <span className="text-foreground-faint" aria-hidden="true">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Star
                      className="w-3 h-3 fill-current"
                      aria-hidden="true"
                    />
                    {formatStars(githubStats.stars)}
                  </span>
                  <span className="text-foreground-faint" aria-hidden="true">
                    ·
                  </span>
                  {registry.github_url ? (
                    <a
                      href={`${registry.github_url.replace(/\.git$/, "")}/commits`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground-secondary transition-colors"
                    >
                      updated {formatRelativeTime(githubStats.lastCommit)}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">
                      updated {formatRelativeTime(githubStats.lastCommit)}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Links */}
            <div className="flex items-center gap-3">
              {registry.github_url && (
                <a
                  href={registry.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${registry.name} on GitHub`}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <GitHubIcon className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              )}
              <a
                href={addUtmParams(registry.url, "registry_overview")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${registry.name} website`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Website</span>
              </a>
            </div>
          </section>

          {/* Browse by Type */}
          <section className="space-y-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Browse by Type
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sortedSlugs.map((slug) => {
                const items = categories.get(slug)!
                const Icon =
                  REGISTRY_TYPE_ICONS[slug] || Package
                const label = REGISTRY_TYPE_LABELS[slug] || slug

                return (
                  <Link
                    key={slug}
                    href={`/${owner}/${repo}/${slug}`}
                    className="group"
                  >
                    <div className="border border-border hover:border-border rounded-lg p-4 transition-all bg-background hover:bg-accent">
                      <div className="flex items-start gap-3">
                        <Icon
                          className="w-5 h-5 flex-shrink-0 mt-0.5 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {label}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                            {items.length}{" "}
                            {items.length === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* Tags — semantic categories from registry items */}
          {semanticCategories.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {semanticCategories.map((cat) => (
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
          )}
        </div>
      </main>

      <StatusBar totalItems={totalItems} selectedFile={null} />
    </div>
  )
}
