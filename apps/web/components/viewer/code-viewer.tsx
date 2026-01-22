"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Badge } from "@workspace/ui/components/badge"
import type { RegistryFile } from "@/lib/viewer-types"
import { codeToHtml } from "shiki"
import { getFileName, getExtension, getTargetPath } from "@/lib/path-utils"

interface CodeViewerProps {
  file: RegistryFile | null
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
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 bg-black p-8">
        <p className="text-sm mb-2">Select a component to view its code</p>
        <p className="text-xs text-neutral-600">Click on any item in the sidebar to get started</p>
      </div>
    )
  }

  const targetPath = getTargetPath(file)
  const fileName = getFileName(targetPath)

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="h-[49px] flex items-center justify-between border-b border-neutral-700/50 bg-black px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{fileName}</span>
          <span className="text-xs text-neutral-500 font-mono">{targetPath}</span>
        </div>
        <Badge variant="secondary" className="text-xs border border-neutral-700/50">
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
