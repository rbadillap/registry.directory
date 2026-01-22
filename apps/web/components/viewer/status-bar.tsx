"use client"

import { Copy, Share2, Sparkles, MessageSquare } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import type { RegistryFile } from "@/lib/viewer-types"

interface StatusBarProps {
  totalItems: number
  selectedFile: RegistryFile | null
  onCopyCode?: () => void
  onShare?: () => void
}

function getFileTypeName(file: RegistryFile | null): string {
  if (!file) return ""

  const type = file.type.replace("registry:", "")
  const extension = file.path.split(".").pop()?.toUpperCase() || ""

  return `${type} • ${extension}`
}

export function StatusBar({ totalItems, selectedFile, onCopyCode, onShare }: StatusBarProps) {
  const fileType = getFileTypeName(selectedFile)

  const handleOpenInV0 = () => {
    if (!selectedFile) return
    window.open("https://v0.dev", "_blank", "noopener,noreferrer")
  }

  const handleOpenInChatGPT = () => {
    if (!selectedFile) return
    window.open("https://chat.openai.com", "_blank", "noopener,noreferrer")
  }

  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t border-neutral-800 bg-black text-xs font-mono">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <span className="text-neutral-500">{totalItems} items</span>
        {fileType && (
          <>
            <span className="text-neutral-700">•</span>
            <span className="text-neutral-400">{fileType}</span>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Open in v0 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-neutral-400 hover:text-white text-xs px-2"
          onClick={handleOpenInV0}
          disabled={!selectedFile}
          title="Open in v0.dev"
        >
          <Sparkles className="h-3.5 w-3.5" />
          v0
        </Button>

        {/* Open in ChatGPT */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-neutral-400 hover:text-white text-xs px-2"
          onClick={handleOpenInChatGPT}
          disabled={!selectedFile}
          title="Open in ChatGPT"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          ChatGPT
        </Button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        {/* Copy code */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-neutral-400 hover:text-white text-xs px-2"
          onClick={onCopyCode}
          disabled={!selectedFile}
          title="Copy code"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-neutral-400 hover:text-white text-xs px-2"
          onClick={onShare}
          disabled={!selectedFile}
          title="Share"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>

        {/* View on GitHub */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-neutral-400 hover:text-white text-xs px-2"
          asChild
          title="View on GitHub"
        >
          <a href="https://github.com/rbadillap/registry.directory" target="_blank" rel="noopener noreferrer">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
            >
              <path d="M22,12.247a10,10,0,0,1-6.833,9.488c-.507.1-.687-.214-.687-.481,0-.328.012-1.407.012-2.743a2.386,2.386,0,0,0-.679-1.852c2.228-.248,4.566-1.093,4.566-4.935a3.859,3.859,0,0,0-1.028-2.683,3.591,3.591,0,0,0-.1-2.647s-.838-.269-2.747,1.025a9.495,9.495,0,0,0-5.007,0c-1.91-1.294-2.75-1.025-2.75-1.025a3.6,3.6,0,0,0-.1,2.647A3.864,3.864,0,0,0,5.62,11.724c0,3.832,2.334,4.69,4.555,4.942A2.137,2.137,0,0,0,9.54,18a2.128,2.128,0,0,1-2.91-.831A2.1,2.1,0,0,0,5.1,16.142s-.977-.013-.069.608A2.646,2.646,0,0,1,6.14,18.213s.586,1.944,3.368,1.34c.005.835.014,1.463.014,1.7,0,.265-.183.574-.683.482A10,10,0,1,1,22,12.247Z"/>
            </svg>
            GitHub
          </a>
        </Button>
      </div>
    </footer>
  )
}
