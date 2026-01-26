"use client"

import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { DirectoryEntry } from "@/lib/types"
import { useAnalytics } from "@/hooks/use-analytics"
import { addUtmParams } from "@/lib/utm-utils"

interface ViewerHeaderProps {
  registry: DirectoryEntry
  currentCategory?: string | null
  selectedItemName?: string | null
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

export function ViewerHeader({ registry, currentCategory, selectedItemName }: ViewerHeaderProps) {
  const analytics = useAnalytics()
  const githubInfo = parseGitHubUrl(registry.github_url)

  // Build base path
  const basePath = githubInfo ? `/${githubInfo.username}/${githubInfo.repo}` : ''

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
    <div className="flex items-center justify-between border-b border-neutral-800 bg-black px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black flex-shrink-0"
        >
          <Link href={backUrl}>
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </Button>

        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          {githubInfo && (
            <Avatar className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0">
              <AvatarImage src={githubInfo.avatarUrl} alt={githubInfo.username} />
              <AvatarFallback className="bg-neutral-800 text-neutral-400 text-xs">
                {githubInfo.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="text-xs md:text-sm font-mono min-w-0 truncate">
            {githubInfo ? (
              <>
                <Link
                  href={`/${githubInfo.username}/${githubInfo.repo}`}
                  className="text-neutral-400 hover:text-white hover:underline transition-colors"
                >
                  {githubInfo.username}
                </Link>
                <span className="text-neutral-600 mx-1 md:mx-1.5">/</span>
                <Link
                  href={`/${githubInfo.username}/${githubInfo.repo}`}
                  className="text-white font-semibold hover:underline transition-colors"
                >
                  {githubInfo.repo}
                </Link>
                {currentCategory && (
                  <>
                    <span className="text-neutral-600 mx-1 md:mx-1.5 hidden md:inline">/</span>
                    {selectedItemName ? (
                      <Link
                        href={`${basePath}/${currentCategory}`}
                        className="text-neutral-400 hover:text-white hover:underline transition-colors hidden md:inline"
                      >
                        {currentCategory}
                      </Link>
                    ) : (
                      <span className="text-white hidden md:inline">{currentCategory}</span>
                    )}
                  </>
                )}
                {selectedItemName && (
                  <>
                    <span className="text-neutral-600 mx-1 md:mx-1.5 hidden md:inline">/</span>
                    <span className="text-white hidden md:inline">{selectedItemName}</span>
                    <span className="text-neutral-600 hidden md:inline">.json</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="text-white">{registry.name}</span>
                <span className="text-neutral-600 mx-1 md:mx-1.5 hidden md:inline">/</span>
                <span className="text-neutral-400 hidden md:inline">IDE Viewer</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <a
            href={addUtmParams(registry.url, "registry_ide")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              analytics.trackRegistryVisit({
                destination: "registry",
                registry_url: registry.url,
              })
            }}
          >
            Visit Registry
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>

        {registry.github_url && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-2 text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <a
              href={registry.github_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                analytics.trackRegistryVisit({
                  destination: "repository",
                  github_url: registry.github_url,
                })
              }}
            >
              Visit Repository
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
