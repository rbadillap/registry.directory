import { Star } from "lucide-react"
import { formatStars, formatRelativeTime } from "@/lib/format-utils"
import type { DirectoryEntry } from "@/lib/types"
import { HeroCtas } from "./hero-ctas"

interface LandingHeroProps {
  registry: DirectoryEntry
  owner: string
  repo: string
  typesCount: number
  totalItems: number
  githubStats?: { stars: number; lastCommit: string } | null
  visitHref: string
}

export function LandingHero({
  registry,
  owner,
  repo,
  typesCount,
  totalItems,
  githubStats,
  visitHref,
}: LandingHeroProps) {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex items-center gap-4">
        {registry.github_profile && (
          <img
            src={registry.github_profile}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 flex-shrink-0 rounded-full"
            loading="eager"
          />
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px] md:leading-9">
            {registry.name}
          </h1>
          <p className="truncate font-mono text-xs text-foreground-faint">
            registry.directory/{owner}/{repo}
          </p>
        </div>
      </div>

      {registry.description && (
        <p className="max-w-[520px] text-base leading-relaxed text-muted-foreground">
          {registry.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
        {totalItems > 0 && (
          <>
            <span className="tabular-nums">
              {typesCount} {typesCount === 1 ? "type" : "types"}
            </span>
            <span className="text-foreground-faint" aria-hidden="true">
              ·
            </span>
            <span className="tabular-nums">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
          </>
        )}
        {githubStats && (
          <>
            {totalItems > 0 && (
              <span className="text-foreground-faint" aria-hidden="true">
                ·
              </span>
            )}
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
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
                className="text-muted-foreground transition-colors hover:text-foreground-secondary"
              >
                updated {formatRelativeTime(githubStats.lastCommit)}
              </a>
            ) : (
              <span>updated {formatRelativeTime(githubStats.lastCommit)}</span>
            )}
          </>
        )}
      </div>

      <HeroCtas
        registryName={registry.name}
        registryUrl={registry.url}
        visitHref={visitHref}
        githubUrl={registry.github_url}
      />
    </div>
  )
}
