import { notFound } from "next/navigation"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Metadata } from "next"
import { RegistryLanding } from "@/components/registry-landing/registry-landing"
import { DirectoryEntry } from "@/lib/types"
import type { Registry, RegistryItem } from "@/lib/registry-types"
import { groupItemsByCategory } from "@/lib/registry-mappings"
import { registryFetch } from "@/lib/fetch-utils"
import { fetchGitHubStatsForUrl } from "@/lib/github-stats"
import { getAffiliates } from "@/lib/affiliates"
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

async function fetchRegistryData(registry: DirectoryEntry): Promise<Registry | null> {
  const targetUrl = registry.registry_url || `${registry.url.replace(/\/$/, '')}/r/registry.json`

  try {
    const response = await registryFetch(targetUrl, {
      timeout: 5000,
      next: { revalidate: 86400 }
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

export type SemanticCategory = { name: string; count: number }

function extractSemanticCategories(items: RegistryItem[]): SemanticCategory[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (item.categories) {
      for (const cat of item.categories) {
        counts.set(cat, (counts.get(cat) || 0) + 1)
      }
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

// Resolve the curated featured names against the fetched index. Declared
// names that don't resolve (or aren't renderable) are dropped with a build
// warning — the daily rebuild re-verifies, so drift surfaces in Vercel logs.
function resolveFeaturedItems(
  registry: DirectoryEntry,
  items: RegistryItem[]
): RegistryItem[] {
  if (!registry.featured?.length) return []

  const byName = new Map(items.map((item) => [item.name, item]))
  const resolved = registry.featured
    .map((name) => byName.get(name))
    .filter((item): item is RegistryItem => Boolean(item))
    .filter((item) => hasOnlyRenderableFiles(item.files))
    .slice(0, 6)

  if (resolved.length < registry.featured.length) {
    const missing = registry.featured.filter(
      (name) => !resolved.some((item) => item.name === name)
    )
    console.warn(
      `[Landing] ${registry.name}: featured items not resolved:`,
      missing
    )
  }

  return resolved
}

export default async function RegistryLandingPage({
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

  // No usable aggregate index (e.g. shadcn/studio only exposes per-item
  // namespaced files) → render the landing in degraded mode instead of
  // bouncing visitors to the registry's own site.
  const items = Array.isArray(registryData?.items) ? registryData.items : []
  const categoriesMap = items.length > 0 ? groupItemsByCategory(items) : null
  const degraded = !categoriesMap || categoriesMap.size === 0

  if (degraded) {
    console.warn(`[Landing] ${registry.name}: degraded mode (no usable index)`)
  }

  const totalItems = categoriesMap
    ? Array.from(categoriesMap.values()).reduce(
        (sum, typed) => sum + typed.length,
        0
      )
    : 0

  // Fetch GitHub stats, semantic categories, and affiliates in parallel
  const [githubStats, semanticCategories, affiliates] = await Promise.all([
    registry.github_url
      ? fetchGitHubStatsForUrl(registry.github_url)
      : Promise.resolve(null),
    Promise.resolve(extractSemanticCategories(items)),
    getAffiliates(),
  ])

  const affiliate = affiliates[registry.url] ?? null

  return (
    <RegistryLanding
      registry={registry}
      categories={degraded ? null : categoriesMap}
      featuredItems={resolveFeaturedItems(registry, items)}
      totalItems={totalItems}
      owner={owner}
      repo={repo}
      githubStats={githubStats}
      semanticCategories={semanticCategories}
      affiliate={affiliate}
    />
  )
}
