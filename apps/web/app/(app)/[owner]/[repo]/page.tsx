import { notFound } from "next/navigation"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Metadata } from "next"
import { RegistryOverview } from "@/components/registry-overview"
import { DirectoryEntry } from "@/lib/types"
import type { Registry } from "@/lib/registry-types"
import { groupItemsByCategory } from "@/lib/registry-mappings"

async function getRegistry(owner: string, repo: string) {
  console.log(`[Level1] Getting registry for ${owner}/${repo}`)
  const filePath = join(process.cwd(), "public/registries.json")
  const fileContents = await readFile(filePath, "utf8")
  const registries = JSON.parse(fileContents) as DirectoryEntry[]

  const registry = registries.find((r) => {
    if (!r.github_url) return false
    const match = r.github_url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) return false
    return match[1] === owner && match[2]?.replace(/\.git$/, '') === repo
  })

  console.log(`[Level1] Registry found:`, !!registry)
  return registry || null
}

async function fetchRegistryData(registry: DirectoryEntry): Promise<Registry | null> {
  const targetUrl = registry.registry_url || `${registry.url.replace(/\/$/, '')}/r/registry.json`
  console.log(`[Level1] Fetching registry data from:`, targetUrl)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      next: { revalidate: 3600 }
    })

    clearTimeout(timeoutId)

    console.log(`[Level1] Fetch response:`, response.status, response.ok)

    if (!response.ok) return null

    const data = await response.json()
    console.log(`[Level1] Registry items count:`, data.items?.length || 0)
    return data
  } catch (error) {
    console.error(`[Level1] Fetch error:`, error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>
}): Promise<Metadata> {
  const { owner, repo } = await params
  const registry = await getRegistry(owner, repo)

  if (!registry) {
    return {
      title: "Registry Not Found",
    }
  }

  return {
    title: registry.name,
    description: registry.description || `Browse components from ${owner}/${repo}`,
  }
}

export async function generateStaticParams() {
  const filePath = join(process.cwd(), "public/registries.json")
  const fileContents = await readFile(filePath, "utf8")
  const registries = JSON.parse(fileContents) as DirectoryEntry[]

  return registries
    .filter((r) => r.github_url)
    .map((r) => {
      const match = r.github_url!.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (!match) return null

      return {
        owner: match[1],
        repo: match[2]?.replace(/\.git$/, '')
      }
    })
    .filter(Boolean) as { owner: string; repo: string }[]
}

export default async function RegistryOverviewPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>
}) {
  console.log(`[Level1] Rendering registry overview page`)
  const { owner, repo } = await params
  const registry = await getRegistry(owner, repo)

  if (!registry) {
    console.log(`[Level1] Registry not found, returning 404`)
    notFound()
  }

  const registryData = await fetchRegistryData(registry)

  if (!registryData) {
    console.log(`[Level1] Registry data not available, returning 404`)
    notFound()
  }

  if (!registryData.items || !Array.isArray(registryData.items)) {
    console.log(`[Level1] Registry items invalid or empty, returning 404`)
    notFound()
  }

  // Group items by category
  const categoriesMap = groupItemsByCategory(registryData.items)
  console.log(`[Level1] Categories found:`, Array.from(categoriesMap.keys()))

  if (categoriesMap.size === 0) {
    console.log(`[Level1] No categories found, returning 404`)
    notFound()
  }

  return (
    <RegistryOverview
      registry={registry}
      categories={categoriesMap}
      owner={owner}
      repo={repo}
    />
  )
}
