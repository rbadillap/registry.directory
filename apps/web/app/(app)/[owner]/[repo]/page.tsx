import { notFound } from "next/navigation"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Metadata } from "next"
import { RegistryOverview } from "@/components/registry-overview"
import { DirectoryEntry } from "@/lib/types"
import type { Registry } from "@/lib/registry-types"
import { groupItemsByCategory } from "@/lib/registry-mappings"
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

async function fetchRegistryData(registry: DirectoryEntry): Promise<Registry | null> {
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

  const registryData = await fetchRegistryData(registry)
  const itemCount = registryData?.items?.length || 0

  return {
    title: registry.name,
    description: registry.description || `Browse ${itemCount} components from ${registry.name}. Preview code in our IDE viewer and install with one command.`,
    alternates: {
      canonical: `https://registry.directory/${owner}/${repo}`,
    },
    openGraph: {
      title: registry.name,
      description: registry.description || `Browse ${itemCount} components from ${registry.name}.`,
      url: `https://registry.directory/${owner}/${repo}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: registry.name,
      description: registry.description || `Browse ${itemCount} components from ${registry.name}.`,
    },
  }
}

export async function generateStaticParams() {
  const filePath = join(process.cwd(), "public/directory.json")
  const fileContents = await readFile(filePath, "utf8")
  const data = JSON.parse(fileContents) as { registries: DirectoryEntry[] }
  const registries = data.registries

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
  const { owner, repo } = await params
  const registry = await getRegistry(owner, repo)

  if (!registry) {
    notFound()
  }

  const registryData = await fetchRegistryData(registry)

  if (!registryData) {
    notFound()
  }

  if (!registryData.items || !Array.isArray(registryData.items)) {
    notFound()
  }

  // Group items by category
  const categoriesMap = groupItemsByCategory(registryData.items)

  if (categoriesMap.size === 0) {
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
