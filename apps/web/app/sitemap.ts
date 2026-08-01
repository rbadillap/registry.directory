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

    const perRegistry = await Promise.allSettled(
      registries.map(async (registry): Promise<MetadataRoute.Sitemap> => {
        // Canonical prefix: /{owner}/{repo} for github-backed entries,
        // /{handle} for namespaced ones. Redirect-only handle aliases are
        // intentionally not listed — redirects don't belong in sitemaps.
        const basePath = registryBasePath(registry)
        if (!basePath) return []

        // Registry overview page
        const urls: MetadataRoute.Sitemap = [
          {
            url: `${baseUrl}${basePath}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          },
        ]

        const registryData = await fetchRegistryIndex(registry, 10000)
        if (!registryData) return urls

        for (const item of registryData.items) {
          if (!hasOnlyRenderableFiles(item.files)) {
            continue
          }

          urls.push({
            url: `${baseUrl}${basePath}/${item.name}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
          })
        }

        return urls
      })
    )

    for (const result of perRegistry) {
      if (result.status === 'fulfilled') {
        entries.push(...result.value)
      }
    }
  } catch (error) {
    console.error('[Sitemap] Error generating sitemap:', error)
  }

  return entries
}
