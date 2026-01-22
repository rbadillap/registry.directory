"use client"

import Link from "next/link"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Package, Blocks, Code, Paintbrush, Box, Palette, FileCode } from "lucide-react"
import { ViewerHeader } from "./viewer/viewer-header"
import { StatusBar } from "./viewer/status-bar"
import type { RegistryItem } from "@/lib/registry-types"
import type { DirectoryEntry } from "@/lib/types"

interface RegistryOverviewProps {
  registry: DirectoryEntry
  categories: Map<string, RegistryItem[]>
  owner: string
  repo: string
}

const CATEGORY_ICONS = {
  ui: Package,
  blocks: Blocks,
  components: Code,
  hooks: Code,
  lib: FileCode,
  pages: FileCode,
  themes: Paintbrush,
  styles: Palette,
  examples: Box,
  base: Box,
} as const

export function RegistryOverview({ registry, categories, owner, repo }: RegistryOverviewProps) {
  console.log('[RegistryOverview] Rendering with categories:', Array.from(categories.keys()))

  const totalItems = Array.from(categories.values()).reduce((sum, items) => sum + items.length, 0)

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <ViewerHeader registry={registry} />

      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar - Registry Info */}
          <Panel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full border-r border-neutral-800 bg-black">
              <div className="p-3 border-b border-neutral-800">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Registry Info
                </span>
              </div>

              <ScrollArea className="h-[calc(100%-49px)]">
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">{registry.name}</h3>
                    {registry.description && (
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        {registry.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-neutral-800">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Categories</span>
                        <span className="text-xs font-mono text-white">{categories.size}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Total Items</span>
                        <span className="text-xs font-mono text-white">{totalItems}</span>
                      </div>
                    </div>
                  </div>

                  {registry.github_url && (
                    <div className="pt-3 border-t border-neutral-800">
                      <a
                        href={registry.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-neutral-400 hover:text-white transition-colors"
                      >
                        View on GitHub →
                      </a>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </Panel>

          <PanelResizeHandle className="w-px bg-neutral-800" />

          {/* Center Panel - Categories Grid */}
          <Panel defaultSize={50} minSize={40}>
            <div className="h-full bg-black">
              <div className="p-3 border-b border-neutral-800">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Browse Categories
                </span>
              </div>

              <ScrollArea className="h-[calc(100%-49px)]">
                <div className="p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {Array.from(categories.entries()).map(([slug, items]) => {
                      const Icon = CATEGORY_ICONS[slug as keyof typeof CATEGORY_ICONS] || Package

                      if (items.length === 0) return null

                      return (
                        <Link
                          key={slug}
                          href={`/${owner}/${repo}/${slug}`}
                          className="group"
                        >
                          <div className="border border-neutral-800 hover:border-neutral-600 rounded-lg p-4 transition-all bg-black hover:bg-neutral-900/50">
                            <div className="flex items-start gap-3">
                              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-500" />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-white capitalize truncate">
                                  {slug}
                                </h3>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {items.length} {items.length === 1 ? 'item' : 'items'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </Panel>

          <PanelResizeHandle className="w-px bg-neutral-800" />

          {/* Right Panel - Category Details */}
          <Panel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full border-l border-neutral-800 bg-black">
              <div className="p-3 border-b border-neutral-800">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Getting Started
                </span>
              </div>

              <ScrollArea className="h-[calc(100%-49px)]">
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Select a Category</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Click on any category to browse its components and blocks.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-800">
                    <h4 className="text-sm font-semibold text-white mb-2">Quick Stats</h4>
                    <div className="space-y-2">
                      {Array.from(categories.entries())
                        .sort((a, b) => b[1].length - a[1].length)
                        .slice(0, 5)
                        .map(([slug, items]) => (
                          <div key={slug} className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400 capitalize">{slug}</span>
                            <span className="text-xs font-mono text-neutral-500">{items.length}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      <StatusBar
        totalItems={totalItems}
        selectedFile={null}
        githubUrl={registry.github_url}
        onCopyCode={() => {}}
        onShare={() => {}}
      />
    </div>
  )
}
