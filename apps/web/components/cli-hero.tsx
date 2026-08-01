"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { useAnalytics } from "@/hooks/use-analytics"

const CLI_COMMAND = 'npx shadcn search @registrydirectory -q "button"'

// The command IS the tagline: the CLI is the primary way in, the site
// below the "or" separator is the alternative.
export function CliHero() {
  const [copied, setCopied] = useState(false)
  const analytics = useAnalytics()

  const handleCopy = () => {
    navigator.clipboard.writeText(CLI_COMMAND)
    setCopied(true)
    analytics.trackCliCopied()
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="flex flex-col items-center w-full px-4 mb-8">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy CLI command"
        className="group flex max-w-full items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-2.5 font-mono text-xs sm:text-sm transition-colors hover:border-muted-foreground/40"
      >
        <span className="overflow-x-auto whitespace-nowrap text-left [scrollbar-width:none]">
          <span className="select-none text-muted-foreground">$ </span>
          <span className="text-muted-foreground">npx shadcn search </span>
          <span className="font-semibold text-foreground">@registrydirectory</span>
          <span className="text-muted-foreground"> -q </span>
          <span className="text-foreground">&quot;button&quot;</span>
        </span>
        <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
          {copied ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
        </span>
      </button>

      <div
        className="mt-8 flex w-full max-w-[220px] items-center gap-3"
        aria-hidden="true"
      >
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <span className="select-none font-mono text-[11px] text-muted-foreground/80">
          or
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>
    </div>
  )
}
