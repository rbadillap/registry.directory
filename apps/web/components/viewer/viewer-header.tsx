"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { DirectoryEntry } from "@/lib/types"

interface ViewerHeaderProps {
  registry: DirectoryEntry
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

export function ViewerHeader({ registry }: ViewerHeaderProps) {
  const pathname = usePathname()
  const githubInfo = parseGitHubUrl(registry.github_url)

  // Calculate back URL based on current path
  const getBackUrl = () => {
    const segments = pathname.split('/').filter(Boolean)

    // If we're at /{owner}/{repo}/{category}/{item}, go back to /{owner}/{repo}/{category}
    if (segments.length >= 4) {
      return `/${segments.slice(0, 3).join('/')}`
    }

    // If we're at /{owner}/{repo}/{category}, go back to /{owner}/{repo}
    if (segments.length === 3) {
      return `/${segments.slice(0, 2).join('/')}`
    }

    // If we're at /{owner}/{repo}, go back to /
    if (segments.length === 2) {
      return '/'
    }

    // Default to home
    return '/'
  }

  const backUrl = getBackUrl()

  return (
    <div className="flex items-center justify-between border-b border-neutral-800 bg-black px-6 py-4">
      <div className="flex items-center gap-4">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <Link href={backUrl}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          {githubInfo && (
            <Avatar className="h-6 w-6">
              <AvatarImage src={githubInfo.avatarUrl} alt={githubInfo.username} />
              <AvatarFallback className="bg-neutral-800 text-neutral-400 text-xs">
                {githubInfo.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="text-sm font-mono">
            {githubInfo ? (
              <>
                <a
                  href={`https://github.com/${githubInfo.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white hover:underline transition-colors"
                >
                  {githubInfo.username}
                </a>
                <span className="text-neutral-600 mx-1.5">/</span>
                <Link
                  href={`/${githubInfo.username}/${githubInfo.repo}`}
                  className="text-white font-semibold hover:underline transition-colors"
                >
                  {githubInfo.repo}
                </Link>
              </>
            ) : (
              <>
                <span className="text-white">{registry.name}</span>
                <span className="text-neutral-600 mx-1.5">/</span>
                <span className="text-neutral-400">IDE Viewer</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <a href={registry.url} target="_blank" rel="noopener noreferrer">
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
            <a href={registry.github_url} target="_blank" rel="noopener noreferrer">
              Visit Repository
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
