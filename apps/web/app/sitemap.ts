import { MetadataRoute } from 'next'
import { hasOnlyRenderableFiles } from "@/lib/file-utils"
import {
  loadDirectory,
  registryBasePath,
  fetchRegistryIndex,
} from "@/lib/resolve-registry"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://registry.directory'
  const entries: MetadataRoute.Sitemap = []

  // Homepage
  entries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
  })

  try {
    const registries = await loadDirectory()

    for (const registry of registries) {
      // Canonical prefix: /{owner}/{repo} for github-backed entries,
      // /{handle} for namespaced ones. Redirect-only handle aliases are
      // intentionally not listed — redirects don't belong in sitemaps.
      const basePath = registryBasePath(registry)
      if (!basePath) continue

      // Add registry overview page
      entries.push({
        url: `${baseUrl}${basePath}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })

      // Fetch registry items
      const registryData = await fetchRegistryIndex(registry, 10000)
      if (!registryData) continue

      for (const item of registryData.items) {
        if (!hasOnlyRenderableFiles(item.files)) {
          continue
        }

        entries.push({
          url: `${baseUrl}${basePath}/${item.name}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      }
    }
  } catch (error) {
    console.error('[Sitemap] Error generating sitemap:', error)
  }

  return entries
}
