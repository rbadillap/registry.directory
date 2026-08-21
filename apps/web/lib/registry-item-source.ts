import type { DirectoryEntry } from "./types"
import type { RegistryItem } from "./registry-types"
import { registryFetch } from "./fetch-utils"

/**
 * An item's full record, source included, read from its origin registry.
 *
 * Pages do not use this: they render from the committed catalog, and the
 * browser asks the aggregated endpoint for the source of the one item being
 * read. It serves the Markdown handlers, which answer a single item on demand
 * and have nowhere else to get its contents.
 */
export async function fetchItemData(
  registry: DirectoryEntry,
  itemName: string
): Promise<RegistryItem | null> {
  let baseUrl: string
  if (registry.registry_url) {
    baseUrl = registry.registry_url.replace(/\/[^/]+\.json$/, "")
  } else {
    baseUrl = `${registry.url.replace(/\/$/, "")}/r`
  }
  const targetUrl = `${baseUrl}/${itemName}.json`

  try {
    const response = await registryFetch(targetUrl, {
      timeout: 5000,
      next: { revalidate: 86400 },
    })

    if (!response.ok) return null

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`[item-source] fetch failed:`, error)
    return null
  }
}
