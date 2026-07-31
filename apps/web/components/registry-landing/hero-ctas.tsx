"use client"

import { ExternalLink } from "lucide-react"
import { GitHubIcon } from "@/components/icons/github"
import { useAnalytics } from "@/hooks/use-analytics"

interface HeroCtasProps {
  registryName: string
  registryUrl: string
  visitHref: string
  githubUrl?: string
}

export function HeroCtas({
  registryName,
  registryUrl,
  visitHref,
  githubUrl,
}: HeroCtasProps) {
  const analytics = useAnalytics()

  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <a
        href={visitHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${registryName} website`}
        onClick={() => {
          analytics.trackRegistryVisit({
            destination: "registry",
            registry_url: registryUrl,
          })
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
            analytics.trackRegistryVisit({
              destination: "repository",
              github_url: githubUrl,
            })
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
