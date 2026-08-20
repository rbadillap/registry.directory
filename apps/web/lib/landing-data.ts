import type { DirectoryEntry, AffiliateConfig } from "./types"
import type { RegistryItem } from "./registry-types"
import { groupItemsByCategory } from "./registry-mappings"
import { hasOnlyRenderableFiles } from "./file-utils"
import { fetchGitHubStatsForUrl } from "./github-stats"
import { getAffiliates } from "./affiliates"
import { loadRegistryIndex } from "./resolve-registry"

export type SemanticCategory = { name: string; count: number }

export function extractSemanticCategories(
  items: RegistryItem[]
): SemanticCategory[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (item.categories) {
      for (const cat of item.categories) {
        counts.set(cat, (counts.get(cat) || 0) + 1)
      }
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

// Resolve the curated featured names against the fetched index. Declared
// names that don't resolve (or aren't renderable) are dropped with a build
// warning — the next index run re-verifies, so drift surfaces there.
export function resolveFeaturedItems(
  registry: DirectoryEntry,
  items: RegistryItem[]
): RegistryItem[] {
  if (!registry.featured?.length) return []

  const byName = new Map(items.map((item) => [item.name, item]))
  const resolved = registry.featured
    .map((name) => byName.get(name))
    .filter((item): item is RegistryItem => Boolean(item))
    .filter((item) => hasOnlyRenderableFiles(item.files))
    .slice(0, 6)

  if (resolved.length < registry.featured.length) {
    const missing = registry.featured.filter(
      (name) => !resolved.some((item) => item.name === name)
    )
    console.warn(
      `[Landing] ${registry.name}: featured items not resolved:`,
      missing
    )
  }

  return resolved
}

export interface LandingData {
  categories: Map<string, RegistryItem[]> | null
  featuredItems: RegistryItem[]
  totalItems: number
  githubStats: { stars: number; lastCommit: string } | null
  semanticCategories: SemanticCategory[]
  affiliate: AffiliateConfig | null
}

// Everything the RegistryLanding needs, for any entry — github-backed or
// handle-only. `categories: null` = degraded mode (no usable aggregate index).
export async function loadLandingData(
  registry: DirectoryEntry
): Promise<LandingData> {
  const registryData = await loadRegistryIndex(registry)

  const items = Array.isArray(registryData?.items) ? registryData.items : []
  const categoriesMap = items.length > 0 ? groupItemsByCategory(items) : null
  const degraded = !categoriesMap || categoriesMap.size === 0

  if (degraded) {
    console.warn(`[Landing] ${registry.name}: degraded mode (no usable index)`)
  }

  const totalItems = categoriesMap
    ? Array.from(categoriesMap.values()).reduce(
        (sum, typed) => sum + typed.length,
        0
      )
    : 0

  const [githubStats, affiliates] = await Promise.all([
    registry.github_url
      ? fetchGitHubStatsForUrl(registry.github_url)
      : Promise.resolve(null),
    getAffiliates(),
  ])

  return {
    categories: degraded ? null : categoriesMap,
    featuredItems: resolveFeaturedItems(registry, items),
    totalItems,
    githubStats,
    semanticCategories: extractSemanticCategories(items),
    affiliate: affiliates[registry.url] ?? null,
  }
}
