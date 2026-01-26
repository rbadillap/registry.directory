"use client"

import { Keyboard } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Kbd } from "@workspace/ui/components/kbd"

const isMac = typeof navigator !== "undefined"
  ? navigator.platform.toUpperCase().indexOf("MAC") >= 0
  : true

const modKey = isMac ? "⌘" : "Ctrl"

const shortcuts = [
  { keys: "←→", label: "Navigate" },
  { keys: "↑↓", label: "Navigate" },
  { keys: "Enter", label: "Open" },
  { keys: `${modKey}F`, label: "Search" },
  { keys: `${modKey}C`, label: "Copy code" },
  { keys: "Esc", label: "Reset" },
  { keys: "?", label: "This help" },
]

interface KeyboardHintsProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function KeyboardHints({ open, onOpenChange }: KeyboardHintsProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="hidden md:flex items-center gap-1 px-1.5 h-5 rounded text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/50 transition-colors"
          aria-label="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-3 w-3" />
          <Kbd className="text-[10px] h-4 min-w-4">?</Kbd>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="min-w-[140px] p-2"
      >
        <div className="space-y-1.5">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Shortcuts</span>
          {shortcuts.map(({ keys, label }) => (
            <div key={keys} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-neutral-400">{label}</span>
              <Kbd className="text-[10px]">{keys}</Kbd>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
