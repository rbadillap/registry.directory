import { MetadataRoute } from 'next'
import { hasOnlyRenderableFiles } from "@/lib/file-utils"
import {
  loadDirectory,
  registryBasePath,
  loadRegistryIndex,
} from "@/lib/resolve-registry"
import { fetchAllGitHubStats } from "@/lib/github-stats"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://registry.directory'
  const entries: MetadataRoute.Sitemap = []

  // One timestamp for the whole build. Stamping `new Date()` per entry would
  // tell crawlers every URL in the directory changed on every deploy, which is
  // how a sitemap teaches Google to stop trusting its own lastmod. The home
  // page genuinely does change with each deploy — the item pages below only
  // claim a date when their registry gives us one.
  const builtAt = new Date()

  // Homepage
  entries.push({
    url: baseUrl,
    lastModified: builtAt,
    changeFrequency: 'weekly',
    priority: 1,
  })

  try {
    const registries = await loadDirectory()

    // Real lastmod for registry landings: the upstream repo's last push, read
    // from the same cached github.json the home page already builds against.
    // Empty when GITHUB_TOKEN is absent, which just means we omit the hint.
    const githubStats = await fetchAllGitHubStats(registries)

    const perRegistry = await Promise.allSettled(
      registries.map(async (registry): Promise<MetadataRoute.Sitemap> => {
        // Canonical prefix: /{owner}/{repo} for github-backed entries,
        // /{handle} for namespaced ones. Redirect-only handle aliases are
        // intentionally not listed — redirects don't belong in sitemaps.
        const basePath = registryBasePath(registry)
        if (!basePath) return []

        const lastCommit = registry.github_url
          ? githubStats[registry.github_url]?.lastCommit
          : undefined

        // Registry overview page
        const urls: MetadataRoute.Sitemap = [
          {
            url: `${baseUrl}${basePath}`,
            ...(lastCommit
              ? { lastModified: new Date(lastCommit) }
              : {}),
            changeFrequency: 'weekly',
            priority: 0.8,
          },
        ]

        const registryData = await loadRegistryIndex(registry)
        if (!registryData) return urls

        for (const item of registryData.items) {
          if (!hasOnlyRenderableFiles(item.files)) {
            continue
          }

          // No per-item date exists upstream, so we inherit the repo's push
          // date rather than invent one. Absent is better than wrong: a false
          // lastmod is the fastest way to get the whole file discounted.
          urls.push({
            url: `${baseUrl}${basePath}/${item.name}`,
            ...(lastCommit ? { lastModified: new Date(lastCommit) } : {}),
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
