/**
 * SECURITY: Explicit controlled mapping of registry types to URL slugs
 * DO NOT use string splitting or dynamic parsing
 */

import type { RegistryItem } from "./registry-types"

export const REGISTRY_TYPE_TO_SLUG = {
  "registry:ui": "ui",
  "registry:block": "blocks",
  "registry:component": "components",
  "registry:hook": "hooks",
  "registry:lib": "lib",
  "registry:page": "pages",
  "registry:theme": "themes",
  "registry:style": "styles",
  "registry:example": "examples",
  "registry:base": "base",
  "registry:font": "fonts",
  "registry:file": "files",
  "registry:item": "items",
  // registry:internal is NOT exposed
} as const

export const SLUG_TO_REGISTRY_TYPE = {
  ui: "registry:ui",
  blocks: "registry:block",
  components: "registry:component",
  hooks: "registry:hook",
  lib: "registry:lib",
  pages: "registry:page",
  themes: "registry:theme",
  styles: "registry:style",
  examples: "registry:example",
  base: "registry:base",
  fonts: "registry:font",
  files: "registry:file",
  items: "registry:item",
} as const

export type RegistrySlug = keyof typeof SLUG_TO_REGISTRY_TYPE
export type RegistryType = keyof typeof REGISTRY_TYPE_TO_SLUG

/**
 * Converts registry type to URL slug safely
 */
export function typeToSlug(type: string): string | null {
  return REGISTRY_TYPE_TO_SLUG[type as RegistryType] || null
}

/**
 * Converts URL slug to registry type safely
 */
export function slugToType(slug: string): string | null {
  return SLUG_TO_REGISTRY_TYPE[slug as RegistrySlug] || null
}

/**
 * Groups registry items by category (slug)
 */
export function groupItemsByCategory(items: RegistryItem[]) {
  const grouped = new Map<string, RegistryItem[]>()

  for (const item of items) {
    const slug = typeToSlug(item.type)
    if (!slug) continue // Skip internal types

    if (!grouped.has(slug)) {
      grouped.set(slug, [])
    }
    grouped.get(slug)!.push(item)
  }

  return grouped
}
