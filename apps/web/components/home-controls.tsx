"use client"

import { useCallback, useEffect, useState } from "react"
import { MessageSquare, Plus } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { FeedbackDialog } from "@/components/feedback-widget"
import { SubmitRegistryModal } from "@/components/submit-registry-dialog"
import { ThemeToggle } from "@/components/theme-toggle"

type Panel = "submit" | "feedback" | null

/** A key press only counts when nobody is typing. */
function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target as HTMLElement)?.isContentEditable === true
  )
}

function Control({
  label,
  shortcut,
  onClick,
  children,
}: {
  label: string
  shortcut: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-haspopup="dialog"
          aria-label={label}
          className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        {label}
        <kbd className="type-label border border-border-subtle px-1 py-0.5 text-muted-foreground">
          {shortcut}
        </kbd>
      </TooltipContent>
    </Tooltip>
  )
}

export function HomeControls() {
  const [panel, setPanel] = useState<Panel>(null)
  const close = useCallback(() => setPanel(null), [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      const key = e.key.toLowerCase()
      if (key === "n") {
        e.preventDefault()
        setPanel((p) => (p === "submit" ? null : "submit"))
      }
      if (key === "f") {
        e.preventDefault()
        setPanel((p) => (p === "feedback" ? null : "feedback"))
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
        <Control label="Submit a registry" shortcut="N" onClick={() => setPanel("submit")}>
          <Plus className="size-4" />
        </Control>
        <Control label="Send feedback" shortcut="F" onClick={() => setPanel("feedback")}>
          <MessageSquare className="size-4" />
        </Control>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <ThemeToggle />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex items-center gap-2">
            Switch theme
            <kbd className="type-label border border-border-subtle px-1 py-0.5 text-muted-foreground">
              D
            </kbd>
          </TooltipContent>
        </Tooltip>
      </div>

      {panel === "submit" && <SubmitRegistryModal onClose={close} />}
      {panel === "feedback" && <FeedbackDialog onClose={close} />}
    </TooltipProvider>
  )
}
