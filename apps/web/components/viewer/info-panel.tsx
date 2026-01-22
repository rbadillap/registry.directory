"use client"

import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Package, FileCode, User } from "lucide-react"
import type { RegistryItem } from "@/lib/viewer-types"

interface InfoPanelProps {
  item: RegistryItem | null
}

export function InfoPanel({ item }: InfoPanelProps) {
  if (!item) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 bg-black border-l border-stone-700/50">
        Select a component to view its information
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-black border-l border-stone-700/50">
      <div className="h-[49px] flex items-center border-b border-stone-700/50 bg-black px-4 flex-shrink-0">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Info</span>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Header Section */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">{item.name}</h2>
              <Badge variant="secondary" className="text-xs border border-stone-700/50">
                {item.type.replace("registry:", "")}
              </Badge>
            </div>

            {/* Description */}
            {item.description && (
              <Card className="bg-stone-900 border-stone-700/50">
                <CardHeader>
                  <CardTitle className="text-sm text-white">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-400">{item.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Files Section */}
            {item.files.length > 0 && (
              <Card className="bg-stone-900 border-stone-700/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-rose-700" />
                    <CardTitle className="text-sm text-white">Files</CardTitle>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {item.files.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {item.files.map((file) => (
                      <div key={file.path} className="text-xs space-y-1">
                        <div className="font-mono text-neutral-400">{file.path}</div>
                        {file.target && (
                          <div className="font-mono text-neutral-500 flex items-center gap-1">
                            <span>→</span>
                            <span>{file.target}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dependencies Section */}
            {item.dependencies && item.dependencies.length > 0 && (
              <Card className="bg-stone-900 border-stone-700/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-rose-700" />
                    <CardTitle className="text-sm text-white">Dependencies</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {item.dependencies.map((dep) => (
                      <Badge
                        key={dep}
                        variant="secondary"
                        className="text-xs font-mono bg-rose-700/10 border-rose-700/30 text-rose-300"
                      >
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Registry Dependencies Section */}
            {item.registryDependencies && item.registryDependencies.length > 0 && (
              <Card className="bg-stone-900 border-stone-700/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-rose-700" />
                    <CardTitle className="text-sm text-white">Registry Dependencies</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {item.registryDependencies.map((dep) => (
                      <Badge
                        key={dep}
                        variant="secondary"
                        className="text-xs font-mono bg-stone-800 border-stone-700/50 text-neutral-300"
                      >
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Author Section */}
            {item.author && (
              <Card className="bg-stone-900 border-stone-700/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-rose-700" />
                    <CardTitle className="text-sm text-white">Author</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {item.author.avatar && (
                      <img
                        src={item.author.avatar}
                        alt={item.author.name}
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <div>
                      <div className="text-sm text-white">{item.author.name}</div>
                      {item.author.url && (
                        <a
                          href={item.author.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-rose-700 hover:underline"
                        >
                          View Profile
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
