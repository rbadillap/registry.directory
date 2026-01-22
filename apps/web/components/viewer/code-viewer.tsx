"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Badge } from "@workspace/ui/components/badge"
import { FileCode, Package } from "lucide-react"
import type { RegistryFile, RegistryItem } from "@/lib/viewer-types"
import { codeToHtml } from "shiki"
import { getFileName, getExtension, getTargetPath } from "@/lib/path-utils"

interface CodeViewerProps {
  file: RegistryFile | null
  selectedItem?: RegistryItem | null
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

export function CodeViewer({ file, selectedItem }: CodeViewerProps) {
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

  // If there's a selected item but no files
  if (!file && selectedItem) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 bg-black p-8">
        <div className="text-center space-y-4 max-w-md">
          <FileCode className="h-12 w-12 text-neutral-700 mx-auto" />
          <div className="space-y-2">
            <p className="text-sm text-neutral-400 font-medium">This item has no files to display</p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              This item only defines dependencies and configuration.
              Check the Configuration panel on the right for more details.
            </p>
          </div>
          {(selectedItem.dependencies?.length || selectedItem.registryDependencies?.length) ? (
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-neutral-600">
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
