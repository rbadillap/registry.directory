"use client"

import Link from "next/link"
import { Package, Blocks, Code, Paintbrush } from "lucide-react"
import type { RegistryItem } from "@/lib/registry-types"

interface CategorySidebarProps {
  categories: Map<string, RegistryItem[]>
  owner: string
  repo: string
}

const CATEGORY_ICONS = {
  ui: Package,
  blocks: Blocks,
  components: Code,
  hooks: Code,
  lib: Code,
  pages: Code,
  themes: Paintbrush,
  styles: Paintbrush,
} as const

export function CategorySidebar({ categories, owner, repo }: CategorySidebarProps) {

  return (
    <div className="max-w-2xl w-full p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Categories</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from(categories.entries()).map(([slug, items]) => {
          const Icon = CATEGORY_ICONS[slug as keyof typeof CATEGORY_ICONS] || Package
          const firstItem = items[0]

          if (!firstItem) return null

          return (
            <Link
              key={slug}
              href={`/${owner}/${repo}/${firstItem.name}`}
              className="group"
            >
              <div className="border border-neutral-800 rounded-lg p-6 hover:border-neutral-600 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {slug}
                  </h3>
                </div>
                <p className="text-sm text-neutral-400">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
