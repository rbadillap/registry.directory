import { notFound } from "next/navigation"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Metadata } from "next"
import { RegistryViewer } from "@/components/registry-viewer"
import { DirectoryEntry } from "@/lib/types"
import type { Registry } from "@/lib/registry-types"
import { slugToType, groupItemsByCategory } from "@/lib/registry-mappings"
import { registryFetch } from "@/lib/fetch-utils"

async function getRegistry(owner: string, repo: string) {
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

  return registry || null
}

async function fetchRegistryIndex(registry: DirectoryEntry): Promise<Registry | null> {
  const targetUrl = registry.registry_url || `${registry.url.replace(/\/$/, '')}/r/registry.json`

  try {
    const response = await registryFetch(targetUrl, {
      timeout: 5000,
      next: { revalidate: 3600 }
    })


    if (!response.ok) return null

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`[CategoryView] Index fetch error:`, error)
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
  params: Promise<{ owner: string; repo: string; category: string }>
}): Promise<Metadata> {
  const { owner, repo, category } = await params
  const registry = await getRegistry(owner, repo)

  if (!registry) {
    return {
      title: "Registry Not Found",
    }
  }

  const categoryLabel = CATEGORY_LABELS[category] || category

  return {
    title: `${categoryLabel} - ${registry.name}`,
    description: `Browse ${categoryLabel.toLowerCase()} from ${owner}/${repo}`,
  }
}

export async function generateStaticParams() {
  const filePath = join(process.cwd(), "public/directory.json")
  const fileContents = await readFile(filePath, "utf8")
  const data = JSON.parse(fileContents) as { registries: DirectoryEntry[] }
  const registries = data.registries

  const params: { owner: string; repo: string; category: string }[] = []

  for (const registry of registries) {
    if (!registry.github_url) continue

    const match = registry.github_url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) continue

    const owner = match[1]
    const repo = match[2]?.replace(/\.git$/, '')

    if (!owner || !repo) continue

    try {
      const targetUrl = registry.registry_url || `${registry.url.replace(/\/$/, '')}/r/registry.json`
      const response = await registryFetch(targetUrl, {
        timeout: 10000,
        next: { revalidate: 3600 }
      })

      if (!response.ok) continue

      const registryData = await response.json() as Registry
      const categoriesMap = groupItemsByCategory(registryData.items)

      for (const category of categoriesMap.keys()) {
        params.push({ owner, repo, category })
      }
    } catch (error) {
      console.error(`[CategoryView] Error generating params for ${owner}/${repo}:`, error)
    }
  }

  return params
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string; category: string }>
}) {
  const { owner, repo, category } = await params

  const registryType = slugToType(category)
  if (!registryType) {
    notFound()
  }

  const registry = await getRegistry(owner, repo)
  if (!registry) {
    notFound()
  }

  const registryIndex = await fetchRegistryIndex(registry)
  if (!registryIndex) {
    notFound()
  }

  // Filter items by category
  const categoriesMap = groupItemsByCategory(registryIndex.items)
  const categoryItems = categoriesMap.get(category)

  if (!categoryItems || categoryItems.length === 0) {
    notFound()
  }


  // Create a filtered registry with only this category's items
  const filteredRegistry: Registry = {
    ...registryIndex,
    items: categoryItems
  }

  return (
    <RegistryViewer
      registry={registry}
      registryIndex={filteredRegistry}
      selectedItem={null}
      currentCategory={category}
    />
  )
}
