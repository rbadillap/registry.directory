"use client"

import Link from "next/link"
import { ArrowLeft, ExternalLink, Home } from "lucide-react"
import { GitHubIcon } from "@/components/icons/github"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import type { DirectoryEntry, AffiliateConfig } from "@/lib/types"
import { useAnalytics } from "@/hooks/use-analytics"
import { addUtmParams } from "@/lib/utm-utils"
import { ThemeToggle } from "@/components/theme-toggle"

interface ViewerHeaderProps {
  registry: DirectoryEntry
  currentCategory?: string | null
  selectedItemName?: string | null
  affiliate?: AffiliateConfig | null
  // Route prefix ("/{owner}/{repo}" or "/{handle}"); derived from github_url when omitted
  basePath?: string
}

function parseGitHubUrl(url?: string) {
  if (!url) return null

  try {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) return null

    const username = match[1]
    const repo = match[2]?.replace(/\.git$/, '') // Remove .git if present

    if (!username || !repo) return null

    return {
      username,
      repo,
      avatarUrl: `https://github.com/${username}.png`
    }
  } catch {
    return null
  }
}

export function ViewerHeader({ registry, currentCategory, selectedItemName, affiliate, basePath: basePathProp }: ViewerHeaderProps) {
  const analytics = useAnalytics()
  const githubInfo = parseGitHubUrl(registry.github_url)

  // Build base path
  const basePath = basePathProp ?? (githubInfo ? `/${githubInfo.username}/${githubInfo.repo}` : '')
  const avatarUrl = githubInfo?.avatarUrl ?? registry.github_profile ?? null

  // Calculate back URL based on context
  const getBackUrl = () => {
    if (!basePath) return '/'

    // If viewing an item, go back to category
    if (selectedItemName && currentCategory) {
      return `${basePath}/${currentCategory}`
    }

    // If viewing a category, go back to overview
    if (currentCategory) {
      return basePath
    }

    // Default: go to home
    return '/'
  }

  const backUrl = getBackUrl()

  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background flex-shrink-0"
        >
          <Link href={backUrl} aria-label="Go back">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </Button>

        <Button
          asChild
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background flex-shrink-0"
        >
          <Link href="/" aria-label="Go to home">
            <Home className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </Button>

        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          {avatarUrl && (
            <Avatar className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0">
              <AvatarImage src={avatarUrl} alt="" />
              <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                {registry.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="text-xs md:text-sm font-mono min-w-0 truncate">
            {githubInfo || basePath ? (
              <>
                {githubInfo ? (
                  <>
                    <Link
                      href={basePath}
                      className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
                    >
                      {githubInfo.username}
                    </Link>
                    <span className="text-foreground-subtle mx-1 md:mx-1.5">/</span>
                    <Link
                      href={basePath}
                      className="text-foreground font-semibold hover:underline transition-colors"
                    >
                      {githubInfo.repo}
                    </Link>
                  </>
                ) : (
                  <Link
                    href={basePath}
                    className="text-foreground font-semibold hover:underline transition-colors"
                  >
                    {basePath.slice(1)}
                  </Link>
                )}
                {currentCategory && (
                  <>
                    <span className="text-foreground-subtle mx-1 md:mx-1.5 hidden md:inline">/</span>
                    {selectedItemName ? (
                      <Link
                        href={`${basePath}/${currentCategory}`}
                        className="text-muted-foreground hover:text-foreground hover:underline transition-colors hidden md:inline"
                      >
                        {currentCategory}
                      </Link>
                    ) : (
                      <span className="text-foreground hidden md:inline">{currentCategory}</span>
                    )}
                  </>
                )}
                {selectedItemName && (
                  <>
                    <span className="text-foreground-subtle mx-1 md:mx-1.5 hidden md:inline">/</span>
                    <span className="text-foreground hidden md:inline">{selectedItemName}</span>
                    <span className="text-foreground-subtle hidden md:inline">.json</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="text-foreground">{registry.name}</span>
                <span className="text-foreground-subtle mx-1 md:mx-1.5 hidden md:inline">/</span>
                <span className="text-muted-foreground hidden md:inline">IDE Viewer</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <a
            href={affiliate ? affiliate.affiliate_url : addUtmParams(registry.url, "registry_ide")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${registry.name} website`}
            onClick={() => {
              analytics.trackRegistryVisit({
                destination: "registry",
                registry_url: registry.url,
              })
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>

        {registry.github_url && (
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <a
              href={registry.github_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${registry.name} on GitHub`}
              onClick={() => {
                analytics.trackRegistryVisit({
                  destination: "repository",
                  github_url: registry.github_url,
                })
              }}
            >
              <GitHubIcon className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        )}

        <ThemeToggle />
      </div>
    </div>
  )
}
