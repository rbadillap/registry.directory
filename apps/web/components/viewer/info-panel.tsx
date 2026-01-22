"use client"

import { useState } from "react"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Package,
  FileCode,
  LayoutGrid,
  Diamond,
  Blocks,
  Code2,
  Library,
  FileText,
  File,
  Palette,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react"
import type { RegistryItem } from "@/lib/viewer-types"
import { getFileName, getTargetPath, getDirName } from "@/lib/path-utils"

const REGISTRY_TYPES = [
  { value: "registry:ui", label: "UI", description: "Primitives and base components", icon: LayoutGrid },
  { value: "registry:component", label: "Component", description: "Standalone reusable components", icon: Diamond },
  { value: "registry:block", label: "Block", description: "Multi-file features or sections", icon: Blocks },
  { value: "registry:hook", label: "Hook", description: "Custom React hooks", icon: Code2 },
  { value: "registry:lib", label: "Library", description: "Utilities and helper functions", icon: Library },
  { value: "registry:page", label: "Page", description: "Full page or route component", icon: FileText },
  { value: "registry:file", label: "File", description: "Config, env, or misc files", icon: File },
  { value: "registry:theme", label: "Theme", description: "CSS variables and theming", icon: Palette },
  { value: "registry:style", label: "Style", description: "Style configurations and presets", icon: Palette },
] as const

interface InfoPanelProps {
  item: RegistryItem | null
}

export function InfoPanel({ item }: InfoPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopyPath = (path: string, index: number) => {
    navigator.clipboard.writeText(path)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1000)
  }

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 bg-black border-l border-neutral-800">
        Select a component to view its information
      </div>
    )
  }

  const currentType = REGISTRY_TYPES.find((t) => t.value === item.type)
  const CurrentIcon = currentType?.icon || Diamond

  const allDeps = [
    ...(item.dependencies || []).map((d) => ({ name: d, type: "npm" as const })),
    ...(item.registryDependencies || []).map((d) => ({ name: d, type: "registry" as const })),
  ]

  return (
    <div className="h-full flex flex-col bg-black border-l border-neutral-800">
      <div className="h-[49px] flex items-center border-b border-neutral-800 bg-black px-4 flex-shrink-0">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Configuration</span>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Main Info Card */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="pt-4 space-y-4">
                {/* Name and Type */}
                <div className="flex gap-3 items-start">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider">Name</div>
                    <div className="text-sm font-medium text-white truncate">{item.name}</div>
                  </div>
                  <div className="space-y-1 flex-shrink-0">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider">Type</div>
                    <div className="flex items-center gap-2 px-2 py-1 bg-neutral-800/50 border border-neutral-800 rounded">
                      <CurrentIcon className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-xs text-neutral-300">{currentType?.label}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <div className="space-y-1 pt-2 border-t border-neutral-800">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider">Description</div>
                    <p className="text-sm text-neutral-400">{item.description}</p>
                  </div>
                )}

                {/* Files */}
                {item.files.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-3.5 w-3.5 text-neutral-500" />
                      <span className="text-xs text-neutral-500 uppercase tracking-wider">Files</span>
                      <Badge variant="secondary" className="ml-auto text-xs h-5">
                        {item.files.length}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {item.files.map((file, index) => {
                        const targetPath = getTargetPath(file)
                        const fileName = getFileName(targetPath)
                        const isCopied = copiedIndex === index

                        return (
                        <button
                          key={file.path}
                          onClick={() => handleCopyPath(targetPath, index)}
                          className="w-full text-left group hover:bg-neutral-800/50 rounded px-2 py-1.5 transition-colors"
                          title="Click to copy path"
                        >
                          <div className="flex items-center gap-2 text-xs min-w-0">
                            <span className="font-mono text-neutral-400 flex-shrink-0">
                              {fileName}
                            </span>
                            <ArrowRight className="h-3 w-3 text-neutral-600 flex-shrink-0" />
                            <span className="font-mono text-neutral-500 truncate flex-1">
                              {targetPath}
                            </span>
                            <span className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isCopied ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3 text-neutral-500" />
                              )}
                            </span>
                          </div>
                        </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dependencies Card */}
            {allDeps.length > 0 && (
              <Card className="bg-neutral-900/50 border-neutral-800">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" />
                    Dependencies
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {item.dependencies && item.dependencies.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">npm packages</div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.dependencies.map((dep) => (
                          <Badge key={dep} variant="outline" className="text-xs font-mono font-normal">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.registryDependencies && item.registryDependencies.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">Registry items</div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.registryDependencies.map((dep) => (
                          <Badge key={dep} variant="secondary" className="text-xs font-normal">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
