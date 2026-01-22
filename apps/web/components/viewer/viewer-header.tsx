import Link from "next/link"
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
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) return null

    const username = match[1]
    const repo = match[2]?.replace(/\.git$/, '') // Remove .git if present

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
  const githubInfo = parseGitHubUrl(registry.github_url)

  return (
    <div className="flex items-center justify-between border-b border-neutral-800 bg-black px-6 py-4">
      <div className="flex items-center gap-4">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <Link href="/">
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
                <span className="text-neutral-400">{githubInfo.username}</span>
                <span className="text-neutral-600 mx-1.5">/</span>
                <span className="text-white font-semibold">{githubInfo.repo}</span>
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
    </div>
  )
}
