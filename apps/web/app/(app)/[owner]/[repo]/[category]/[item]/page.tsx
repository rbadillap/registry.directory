import { notFound } from "next/navigation"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Metadata } from "next"
import { RegistryViewer } from "@/components/registry-viewer"
import { DirectoryEntry } from "@/lib/types"
import type { Registry, RegistryItem } from "@/lib/registry-types"
import { slugToType, typeToSlug, groupItemsByCategory } from "@/lib/registry-mappings"
import { registryFetch } from "@/lib/fetch-utils"

async function getRegistry(owner: string, repo: string) {
  console.log(`[Level2] Getting registry for ${owner}/${repo}`)
  const filePath = join(process.cwd(), "public/directory.json")
  const fileContents = await readFile(filePath, "utf8")
  const data = JSON.parse(fileContents) as { registries: DirectoryEntry[] }
  const registries = data.registries

  const registry = registries.find((r) => {
    if (!r.github_url) return false
    const match = r.github_url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) return false
    return match[1] === owner && match[2]?.replace(/\.git$/, '') === repo
  })

  console.log(`[Level2] Registry found:`, !!registry)
  return registry || null
}

async function fetchRegistryIndex(registry: DirectoryEntry): Promise<Registry | null> {
  const targetUrl = registry.registry_url || `${registry.url.replace(/\/$/, '')}/r/registry.json`
  console.log(`[Level2] Fetching registry index from:`, targetUrl)

  try {
    const response = await registryFetch(targetUrl, {
      timeout: 5000,
      next: { revalidate: 3600 }
    })

    console.log(`[Level2] Index fetch response:`, response.status, response.ok)

    if (!response.ok) return null

    const data = await response.json()
    console.log(`[Level2] Registry items count:`, data.items?.length || 0)
    return data
  } catch (error) {
    console.error(`[Level2] Index fetch error:`, error)
    return null
  }
}

async function fetchItemData(
  registry: DirectoryEntry,
  itemName: string
): Promise<RegistryItem | null> {
  // Use registry_url base if available, otherwise fall back to url
  let baseUrl: string
  if (registry.registry_url) {
    // Extract base from registry_url (remove /registry.json)
    baseUrl = registry.registry_url.replace(/\/[^/]+\.json$/, '')
  } else {
    baseUrl = registry.url.replace(/\/$/, '')
  }
  const targetUrl = `${baseUrl}/${itemName}.json`
  console.log(`[Level2] Fetching item data from:`, targetUrl)

  try {
    const response = await registryFetch(targetUrl, {
      timeout: 5000,
      next: { revalidate: 3600 }
    })

    console.log(`[Level2] Item fetch response:`, response.status, response.ok)

    if (!response.ok) return null

    const data = await response.json()
    console.log(`[Level2] Item files count:`, data.files?.length || 0)
    return data
  } catch (error) {
    console.error(`[Level2] Item fetch error:`, error)
    return null
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  ui: "UI Components",
  blocks: "Blocks",
  components: "Components",
  hooks: "Hooks",
  lib: "Libraries",
  pages: "Pages",
  themes: "Themes",
  styles: "Styles",
  examples: "Examples",
  base: "Base",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; repo: string; category: string; item: string }>
}): Promise<Metadata> {
  const { owner, repo, category, item } = await params
  const registry = await getRegistry(owner, repo)

  if (!registry) {
    return {
      title: "Registry Not Found",
    }
  }

  const categoryLabel = CATEGORY_LABELS[category] || category

  return {
    title: `${item} - ${categoryLabel}`,
    description: `View ${item} from ${registry.name} ${categoryLabel.toLowerCase()}`,
  }
}

export async function generateStaticParams() {
  console.log(`[Level2] Generating static params`)
  const filePath = join(process.cwd(), "public/directory.json")
  const fileContents = await readFile(filePath, "utf8")
  const data = JSON.parse(fileContents) as { registries: DirectoryEntry[] }
  const registries = data.registries

  const params: { owner: string; repo: string; category: string; item: string }[] = []

  for (const registry of registries) {
    if (!registry.github_url) continue

    const match = registry.github_url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) continue

    const owner = match[1]
    const repo = match[2]?.replace(/\.git$/, '')

    if (!owner || !repo) continue

    // Fetch registry data to get all items
    try {
      const targetUrl = registry.registry_url || `${registry.url.replace(/\/$/, '')}/r/registry.json`
      const response = await registryFetch(targetUrl, {
        timeout: 10000,
        next: { revalidate: 3600 }
      })

      if (!response.ok) continue

      const registryData = await response.json() as Registry
      const categoriesMap = groupItemsByCategory(registryData.items)

      // Generate params for each category/item combination
      for (const [category, items] of categoriesMap.entries()) {
        for (const item of items) {
          params.push({
            owner,
            repo,
            category,
            item: item.name
          })
        }
      }
    } catch (error) {
      console.error(`[Level2] Error generating params for ${owner}/${repo}:`, error)
    }
  }

  console.log(`[Level2] Generated ${params.length} static params`)
  return params
}

export default async function ItemViewerPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string; category: string; item: string }>
}) {
  console.log(`[Level2] Rendering item viewer page`)
  const { owner, repo, category, item } = await params
  console.log(`[Level2] Params:`, { owner, repo, category, item })

  // Validate that the category is valid
  const registryType = slugToType(category)
  if (!registryType) {
    console.log(`[Level2] Invalid category slug:`, category)
    notFound()
  }
  console.log(`[Level2] Category validated:`, category, '→', registryType)

  const registry = await getRegistry(owner, repo)
  if (!registry) {
    console.log(`[Level2] Registry not found`)
    notFound()
  }

  // Fetch registry index for sidebar
  const registryIndex = await fetchRegistryIndex(registry)
  if (!registryIndex) {
    console.log(`[Level2] Registry index not available`)
    notFound()
  }

  // Fetch specific item
  const itemData = await fetchItemData(registry, item)
  if (!itemData) {
    console.log(`[Level2] Item data not found:`, item)
    notFound()
  }

  // Validate that the item belongs to the category
  const itemCategory = typeToSlug(itemData.type)
  if (itemCategory !== category) {
    console.log(`[Level2] Item category mismatch:`, itemCategory, '!==', category)
    notFound()
  }

  console.log(`[Level2] Rendering with item:`, itemData.name)

  // Filter registry to only show items from this category
  const categoriesMap = groupItemsByCategory(registryIndex.items)
  const categoryItems = categoriesMap.get(category) || []

  const filteredRegistry: Registry = {
    ...registryIndex,
    items: categoryItems
  }

  return (
    <RegistryViewer
      registry={registry}
      registryIndex={filteredRegistry}
      selectedItem={itemData}
      currentCategory={category}
    />
  )
}
