"use client"

import { ExternalLink } from "lucide-react"
import { GitHubIcon } from "@/components/icons/github"
import { useAnalytics } from "@/hooks/use-analytics"

interface HeroCtasProps {
  registryName: string
  visitHref: string
  sponsored: boolean
  githubUrl?: string
}

export function HeroCtas({
  registryName,
  visitHref,
  sponsored,
  githubUrl,
}: HeroCtasProps) {
  const analytics = useAnalytics()

  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <a
        href={visitHref}
        target="_blank"
        // An affiliate link sends the referrer, so the vendor sees where the
        // visit came from; noopener stays on every external link.
        rel={sponsored ? "sponsored noopener" : "noopener noreferrer"}
        aria-label={`Visit ${registryName} website`}
        onClick={() => {
          analytics.trackRegistryVisit({ sponsored })
        }}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        Visit {registryName}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${registryName} on GitHub`}
          onClick={() => {
            analytics.trackRepositoryVisit()
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <GitHubIcon className="h-3.5 w-3.5" aria-hidden="true" />
          View on GitHub
        </a>
      )}
    </div>
  )
}
