"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Badge } from "@workspace/ui/components/badge"
import type { RegistryFile } from "@/lib/viewer-types"
import { codeToHtml } from "shiki"

interface CodeViewerProps {
  file: RegistryFile | null
}

function getLanguageFromPath(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase() || ""

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

export function CodeViewer({ file }: CodeViewerProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!file) {
      setHighlightedCode("")
      return
    }

    setIsLoading(true)
    const language = getLanguageFromPath(file.path)

    codeToHtml(file.code, {
      lang: language,
      theme: "github-dark",
      colorReplacements: {
        "#24292e": "transparent",
      },
    })
      .then((html: string) => {
        setHighlightedCode(html)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        console.error("Error highlighting code:", error)
        setHighlightedCode("")
        setIsLoading(false)
      })
  }, [file])

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 bg-black">
        Select a file to view its code
      </div>
    )
  }

  const fileName = file.path.split("/").pop() || file.path

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="h-[49px] flex items-center justify-between border-b border-stone-700/50 bg-black px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{fileName}</span>
          <span className="text-xs text-neutral-500 font-mono">{file.path}</span>
        </div>
        <Badge variant="secondary" className="text-xs border border-stone-700/50">
          {file.type.replace("registry:", "")}
        </Badge>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="p-4 text-sm text-neutral-500">Loading...</div>
          ) : (
            <div
              className="p-4 text-sm font-mono"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
