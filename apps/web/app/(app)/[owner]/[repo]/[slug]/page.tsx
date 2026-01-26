import { notFound } from "next/navigation"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Metadata } from "next"
import { RegistryViewer } from "@/components/registry-viewer"
import { DirectoryEntry } from "@/lib/types"
import type { Registry, RegistryItem } from "@/lib/registry-types"
import { slugToType, typeToSlug, groupItemsByCategory, SLUG_TO_REGISTRY_TYPE } from "@/lib/registry-mappings"
import { registryFetch } from "@/lib/fetch-utils"
import { hasOnlyRenderableFiles } from "@/lib/file-utils"

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
    console.error(`[SlugView] Index fetch error:`, error)
    return null
  }
}

async function fetchItemData(
  registry: DirectoryEntry,
  itemName: string
): Promise<RegistryItem | null> {
  let baseUrl: string
  if (registry.registry_url) {
    baseUrl = registry.registry_url.replace(/\/[^/]+\.json$/, '')
  } else {
    baseUrl = `${registry.url.replace(/\/$/, '')}/r`
  }
  const targetUrl = `${baseUrl}/${itemName}.json`

  try {
    const response = await registryFetch(targetUrl, {
      timeout: 5000,
      next: { revalidate: 3600 }
    })

    if (!response.ok) return null

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`[SlugView] Item fetch error:`, error)
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

// Check if slug is a category
function isCategory(slug: string): boolean {
  return slug in SLUG_TO_REGISTRY_TYPE
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; repo: string; slug: string }>
}): Promise<Metadata> {
  const { owner, repo, slug } = await params
  const registry = await getRegistry(owner, repo)

  if (!registry) {
    return { title: "Registry Not Found" }
  }

  // Category view
  if (isCategory(slug)) {
    const categoryLabel = CATEGORY_LABELS[slug] || slug
    return {
      title: `${categoryLabel} - ${registry.name}`,
      description: `Browse ${categoryLabel.toLowerCase()} from ${registry.name}.`,
      alternates: {
        canonical: `https://registry.directory/${owner}/${repo}/${slug}`,
      },
    }
  }

  // Item view
  const itemData = await fetchItemData(registry, slug)
  const categorySlug = itemData ? typeToSlug(itemData.type) : null
  const categoryLabel = categorySlug ? (CATEGORY_LABELS[categorySlug] || categorySlug) : "Component"

  return {
    title: `${slug} - ${categoryLabel}`,
    description: `${itemData?.description || slug}: A ${categoryLabel.toLowerCase()} from ${registry.name}. Preview code and install with one command.`,
    alternates: {
      canonical: `https://registry.directory/${owner}/${repo}/${slug}`,
    },
    openGraph: {
      title: `${slug} - ${registry.name}`,
      description: `${itemData?.description || slug}: A ${categoryLabel.toLowerCase()} from ${registry.name}.`,
      url: `https://registry.directory/${owner}/${repo}/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${slug} - ${registry.name}`,
      description: `${itemData?.description || slug}: A ${categoryLabel.toLowerCase()} from ${registry.name}.`,
    },
  }
}

export async function generateStaticParams() {
  const filePath = join(process.cwd(), "public/directory.json")
  const fileContents = await readFile(filePath, "utf8")
  const data = JSON.parse(fileContents) as { registries: DirectoryEntry[] }
  const registries = data.registries

  const params: { owner: string; repo: string; slug: string }[] = []

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

      // Add category slugs
      for (const category of categoriesMap.keys()) {
        params.push({ owner, repo, slug: category })
      }

      // Add item slugs
      for (const item of registryData.items) {
        if (!hasOnlyRenderableFiles(item.files)) {
          continue
        }
        params.push({ owner, repo, slug: item.name })
      }
    } catch (error) {
      console.error(`[SlugView] Error generating params for ${owner}/${repo}:`, error)
    }
  }

  return params
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string; slug: string }>
}) {
  const { owner, repo, slug } = await params

  const registry = await getRegistry(owner, repo)
  if (!registry) {
    notFound()
  }

  const registryIndex = await fetchRegistryIndex(registry)
  if (!registryIndex) {
    notFound()
  }

  const categoriesMap = groupItemsByCategory(registryIndex.items)

  // Category view: show list of items in category
  if (isCategory(slug)) {
    const registryType = slugToType(slug)
    if (!registryType) {
      notFound()
    }

    const categoryItems = categoriesMap.get(slug)
    if (!categoryItems || categoryItems.length === 0) {
      notFound()
    }

    const filteredRegistry: Registry = {
      ...registryIndex,
      items: categoryItems
    }

    return (
      <RegistryViewer
        registry={registry}
        registryIndex={filteredRegistry}
        selectedItem={null}
        currentCategory={slug}
      />
    )
  }

  // Item view: show specific item
  const itemData = await fetchItemData(registry, slug)
  if (!itemData) {
    notFound()
  }

  const currentCategory = typeToSlug(itemData.type)
  const categoryItems = categoriesMap.get(currentCategory) || []

  const filteredRegistry: Registry = {
    ...registryIndex,
    items: categoryItems
  }

  return (
    <RegistryViewer
      registry={registry}
      registryIndex={filteredRegistry}
      selectedItem={itemData}
      currentCategory={currentCategory}
    />
  )
}
