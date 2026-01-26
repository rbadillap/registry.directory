import { MetadataRoute } from 'next'
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "@/lib/types"
import type { Registry } from "@/lib/registry-types"
import { registryFetch } from "@/lib/fetch-utils"
import { hasOnlyRenderableFiles } from "@/lib/file-utils"

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
    const filePath = join(process.cwd(), "public/directory.json")
    const fileContents = await readFile(filePath, "utf8")
    const data = JSON.parse(fileContents) as { registries: DirectoryEntry[] }
    const registries = data.registries

    for (const registry of registries) {
      if (!registry.github_url) continue

      const match = registry.github_url.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (!match) continue

      const owner = match[1]
      const repo = match[2]?.replace(/\.git$/, '')

      if (!owner || !repo) continue

      // Add registry overview page
      entries.push({
        url: `${baseUrl}/${owner}/${repo}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })

      // Fetch registry items
      try {
        const targetUrl = registry.registry_url || `${registry.url.replace(/\/$/, '')}/r/registry.json`
        const response = await registryFetch(targetUrl, {
          timeout: 10000,
          next: { revalidate: 3600 }
        })

        if (!response.ok) continue

        const registryData = await response.json() as Registry

        for (const item of registryData.items) {
          if (!hasOnlyRenderableFiles(item.files)) {
            continue
          }

          entries.push({
            url: `${baseUrl}/${owner}/${repo}/${item.name}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
          })
        }
      } catch (error) {
        console.error(`[Sitemap] Error fetching registry data for ${owner}/${repo}:`, error)
      }
    }
  } catch (error) {
    console.error('[Sitemap] Error generating sitemap:', error)
  }

  return entries
}
