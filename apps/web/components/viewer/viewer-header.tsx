import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { DirectoryEntry } from "@/lib/types"

interface ViewerHeaderProps {
  registry: DirectoryEntry
}

export function ViewerHeader({ registry }: ViewerHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-stone-700/50 bg-black px-6 py-4">
      <div className="flex items-center gap-4">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="text-sm text-white">
          <span className="text-rose-700">{registry.name}</span>
          <span className="text-neutral-500"> / </span>
          <span>IDE Viewer</span>
        </div>
      </div>

      <Button
        asChild
        variant="ghost"
        size="sm"
        className="gap-2 text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <a href={registry.url} target="_blank" rel="noopener noreferrer">
          Visit Registry
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  )
}
