"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area"
import { Button } from "@workspace/ui/components/button"
import { FileCode, Package, Copy, Check, FileWarning } from "lucide-react"
import type { RegistryItem, SourceStatus } from "@/lib/registry-types"
import { codeToHtml } from "shiki"
import { getFileName, getExtension, getTargetPath } from "@/lib/path-utils"
import { useAnalytics } from "@/hooks/use-analytics"
import { isBinaryExtension } from "@/lib/file-utils"

type RegistryFile = NonNullable<RegistryItem["files"]>[number]

// One place where a status becomes words. Two cascades meant two chances to
// forget a state, which is how "not-found" went missing from both.
const SOURCE_MESSAGE: Record<Exclude<SourceStatus, "ready">, string> = {
  idle: "Loading source…",
  loading: "Loading source…",
  "not-found": "This registry no longer serves this item",
  error: "This registry did not return the source",
}

interface CodeViewerProps {
  file: RegistryFile | null
  selectedItem?: RegistryItem | null
  /** Whether the file's source has arrived yet. Paths render from the
   *  committed catalog; contents are fetched separately. */
  sourceStatus?: SourceStatus
  /** What the origin registry answered when the source could not be read. */
  sourceError?: string
}

function getLanguageFromPath(path: string): string {
  const extension = getExtension(path).toLowerCase()

  const extensionMap: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    css: "css",
    json: "json",
    md: "markdown",
    html: "html",
    yml: "yaml",
    yaml: "yaml",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    cpp: "cpp",
    c: "c",
    php: "php",
    sh: "bash",
    sql: "sql",
    xml: "xml",
  }

  return extensionMap[extension] || "text"
}

export function CodeViewer({ file, selectedItem, sourceStatus = "ready", sourceError }: CodeViewerProps) {
  const analytics = useAnalytics()
  const { resolvedTheme } = useTheme()
  const [highlightedCode, setHighlightedCode] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // No source yet: the same file is highlighted twice, once empty and once
    // with its contents, and the empty pass can finish last. Skipping it means
    // there is only ever one result to keep.
    if (!file?.content) {
      setHighlightedCode("")
      setIsLoading(false)
      return
    }

    let current = true
    setIsLoading(true)
    const language = getLanguageFromPath(file.path)
    const isDark = resolvedTheme === "dark"
    const shikiTheme = isDark ? "github-dark" : "github-light"

    // Only replace background colors — not foreground text colors.
    // github-dark bg: #24292e, github-light bg: #fff/#ffffff
    const colorReplacements: Record<string, string> = isDark
      ? { "#24292e": "transparent" }
      : { "#fff": "transparent", "#ffffff": "transparent" }

    codeToHtml(file.content, {
      lang: language,
      theme: shikiTheme,
      colorReplacements,
    })
      .then((html: string) => {
        if (!current) return
        setHighlightedCode(html)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (!current) return
        console.error("Error highlighting code:", error)
        setHighlightedCode("")
        setIsLoading(false)
      })

    return () => {
      current = false
    }
  }, [file, resolvedTheme])

  // If there's a selected item but no files
  // No file to show, and four different reasons why. "This item has no files"
  // is the last of them, and only earns the claim once the others are ruled
  // out: until the source has been asked for and answered, it is a conclusion
  // drawn ahead of the evidence.
  if (!file && selectedItem && sourceStatus !== "ready") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-background p-8">
        <p className="text-sm mb-2">{SOURCE_MESSAGE[sourceStatus]}</p>
        <p className="text-xs text-foreground-subtle">
          {selectedItem.name}
          {sourceStatus === "error" && sourceError ? ` — ${sourceError}` : ""}
        </p>
      </div>
    )
  }

  if (!file && selectedItem) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-background p-8">
        <div className="text-center space-y-4 max-w-md">
          <FileCode className="h-12 w-12 text-foreground-faint mx-auto" />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">This item has no files to display</p>
            <p className="text-xs text-foreground-subtle leading-relaxed">
              This item only defines dependencies and configuration.
              Check the Configuration panel on the right for more details.
            </p>
          </div>
          {(selectedItem.dependencies?.length || selectedItem.registryDependencies?.length) ? (
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-foreground-subtle">
              <Package className="h-4 w-4" />
              <span>
                {selectedItem.dependencies?.length || 0} npm package{selectedItem.dependencies?.length !== 1 ? 's' : ''}
                {selectedItem.registryDependencies?.length ? ` • ${selectedItem.registryDependencies.length} registry item${selectedItem.registryDependencies.length !== 1 ? 's' : ''}` : ''}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  // No file and no selected item - default empty state
  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-background p-8">
        <p className="text-sm mb-2">Select a component to view its code</p>
        <p className="text-xs text-foreground-subtle">Click on any item in the sidebar to get started</p>
      </div>
    )
  }

  // The path is known and the source is not, which is a state of its own:
  // the file exists, and either it is on its way or its origin refused it.
  if (!file.content && sourceStatus !== "ready") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-background p-8">
        <p className="text-sm mb-2">{SOURCE_MESSAGE[sourceStatus]}</p>
        <p className="text-xs text-foreground-subtle">
          {getFileName(getTargetPath(file))}
          {sourceStatus === "error" && sourceError ? ` — ${sourceError}` : ""}
        </p>
      </div>
    )
  }

  const targetPath = getTargetPath(file)
  const fileName = getFileName(targetPath)
  const fileExtension = getExtension(targetPath)

  // Handle binary files that cannot be rendered
  if (isBinaryExtension(fileExtension)) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="h-[44px] md:h-[49px] flex items-center border-b border-border-subtle bg-background px-3 md:px-4 flex-shrink-0">
          <span className="text-xs md:text-sm font-mono text-muted-foreground truncate">{fileName}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
          <FileWarning className="h-12 w-12 text-foreground-faint mb-4" />
          <p className="text-sm text-muted-foreground font-medium mb-2">Binary file</p>
          <p className="text-xs text-foreground-subtle text-center max-w-xs">
            This file ({fileExtension.toUpperCase()}) cannot be displayed as code.
          </p>
        </div>
      </div>
    )
  }

  const handleCopy = () => {
    if (!file.content) return
    navigator.clipboard.writeText(file.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    // Track code copy
    analytics.trackCodeCopied({
      file_path: getTargetPath(file),
      code_length: file.content.length,
      has_content: Boolean(file.content),
    })
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-[44px] md:h-[49px] flex items-center justify-between border-b border-border-subtle bg-background px-3 md:px-4 flex-shrink-0">
        <span className="text-xs md:text-sm font-mono text-muted-foreground truncate">{fileName}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-muted-foreground hover:text-foreground px-2 flex-shrink-0"
          onClick={handleCopy}
          title="Copy code"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="p-3 md:p-4 text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div
              className="p-3 md:p-4 text-xs md:text-sm font-mono [counter-reset:line] [&_.line]:before:content-[counter(line)] [&_.line]:before:[counter-increment:line] [&_.line]:before:sticky [&_.line]:before:left-0 [&_.line]:before:inline-block [&_.line]:before:w-12 [&_.line]:before:pr-4 [&_.line]:before:pl-3 [&_.line]:before:text-right [&_.line]:before:text-foreground-subtle [&_.line]:before:select-none [&_.line]:before:bg-background"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          )}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  )
}
