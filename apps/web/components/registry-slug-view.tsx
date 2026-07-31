import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { RegistryViewer } from "@/components/registry-viewer"
import type { DirectoryEntry } from "@/lib/types"
import type { Registry, RegistryItem } from "@/lib/registry-types"
import {
  slugToType,
  typeToSlug,
  groupItemsByCategory,
  SLUG_TO_REGISTRY_TYPE,
  REGISTRY_TYPE_LABELS,
} from "@/lib/registry-mappings"
import { registryFetch } from "@/lib/fetch-utils"
import { getAffiliates } from "@/lib/affiliates"
import { fetchRegistryIndex } from "@/lib/resolve-registry"

export function isCategory(slug: string): boolean {
  return slug in SLUG_TO_REGISTRY_TYPE
}

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
    console.error(`[SlugView] Item fetch error:`, error)
    return null
  }
}

// Metadata for a category-or-item view living at `${basePath}/${slug}`.
export async function buildSlugMetadata(
  registry: DirectoryEntry,
  basePath: string,
  slug: string
): Promise<Metadata> {
  const canonical = `https://registry.directory${basePath}/${slug}`

  if (isCategory(slug)) {
    const categoryLabel = REGISTRY_TYPE_LABELS[slug] || slug
    return {
      title: `${categoryLabel} - ${registry.name}`,
      description: `Browse ${categoryLabel.toLowerCase()} from ${registry.name}.`,
      alternates: { canonical },
    }
  }

  // Item view - use registry index instead of individual fetch to avoid timeout during build
  const registryIndex = await fetchRegistryIndex(registry)
  const itemData = registryIndex?.items?.find((item) => item.name === slug)
  const categorySlug = itemData ? typeToSlug(itemData.type) : null
  const categoryLabel = categorySlug
    ? REGISTRY_TYPE_LABELS[categorySlug] || categorySlug
    : "Component"

  return {
    title: `${slug} - ${categoryLabel}`,
    description: `${itemData?.description || slug}: A ${categoryLabel.toLowerCase()} from ${registry.name}. Preview code and install with one command.`,
    alternates: { canonical },
    openGraph: {
      title: `${slug} - ${registry.name}`,
      description: `${itemData?.description || slug}: A ${categoryLabel.toLowerCase()} from ${registry.name}.`,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${slug} - ${registry.name}`,
      description: `${itemData?.description || slug}: A ${categoryLabel.toLowerCase()} from ${registry.name}.`,
    },
  }
}

// Category-or-item viewer for any entry, at `${basePath}/${slug}`.
// Calls notFound() internally when the slug doesn't resolve.
export async function RegistrySlugView({
  registry,
  basePath,
  slug,
}: {
  registry: DirectoryEntry
  basePath: string
  slug: string
}) {
  const registryIndex = await fetchRegistryIndex(registry)
  if (!registryIndex) {
    notFound()
  }

  const [categoriesMap, affiliates] = await Promise.all([
    Promise.resolve(groupItemsByCategory(registryIndex.items)),
    getAffiliates(),
  ])
  const affiliate = affiliates[registry.url] ?? null

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
      items: categoryItems,
    }

    return (
      <RegistryViewer
        registry={registry}
        registryIndex={filteredRegistry}
        selectedItem={null}
        currentCategory={slug}
        affiliate={affiliate}
        basePath={basePath}
      />
    )
  }

  // Item view: show specific item
  const itemData = await fetchItemData(registry, slug)
  if (!itemData) {
    notFound()
  }

  const currentCategory = typeToSlug(itemData.type)
  if (!currentCategory) {
    notFound()
  }

  const categoryItems = categoriesMap.get(currentCategory) || []

  const filteredRegistry: Registry = {
    ...registryIndex,
    items: categoryItems,
  }

  return (
    <RegistryViewer
      registry={registry}
      registryIndex={filteredRegistry}
      selectedItem={itemData}
      currentCategory={currentCategory}
      affiliate={affiliate}
      basePath={basePath}
    />
  )
}
