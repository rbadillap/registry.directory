import { notFound, permanentRedirect } from "next/navigation"
import type { Metadata } from "next"
import { RegistryLanding } from "@/components/registry-landing/registry-landing"
import { groupItemsByCategory } from "@/lib/registry-mappings"
import { hasOnlyRenderableFiles } from "@/lib/file-utils"
import { loadLandingData } from "@/lib/landing-data"
import {
  loadDirectory,
  entryHandle,
  parseGithubRef,
  resolveByGithub,
  resolveByHandle,
  fetchRegistryIndex,
} from "@/lib/resolve-registry"
import {
  RegistrySlugView,
  buildSlugMetadata,
} from "@/components/registry-slug-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>
}): Promise<Metadata> {
  const { owner, repo } = await params

  // Canonical github pair → registry landing metadata
  const ghRegistry = await resolveByGithub(owner, repo)
  if (ghRegistry) {
    const index = await fetchRegistryIndex(ghRegistry)
    const itemCount = index?.items?.length || 0
    const canonical = `https://registry.directory/${owner}/${repo}`

    return {
      title: ghRegistry.name,
      description: ghRegistry.description || `Browse ${itemCount} components from ${ghRegistry.name}. Preview code in our IDE viewer and install with one command.`,
      alternates: { canonical },
      openGraph: {
        title: ghRegistry.name,
        description: ghRegistry.description || `Browse ${itemCount} components from ${ghRegistry.name}.`,
        url: canonical,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: ghRegistry.name,
        description: ghRegistry.description || `Browse ${itemCount} components from ${ghRegistry.name}.`,
      },
    }
  }

  // Handle + slug (github-less entry) → viewer metadata; redirecting aliases get none
  const handleRegistry = await resolveByHandle(owner)
  if (!handleRegistry) {
    return { title: "Registry Not Found" }
  }
  if (parseGithubRef(handleRegistry.github_url)) {
    return {}
  }

  return buildSlugMetadata(handleRegistry, `/${owner}`, repo)
}

export async function generateStaticParams() {
  const registries = await loadDirectory()

  const results = await Promise.allSettled(
    registries.map(async (registry) => {
      // Canonical github pairs
      const gh = parseGithubRef(registry.github_url)
      if (gh) {
        return [{ owner: gh.owner, repo: gh.repo }]
      }

      // Github-less entries: /{handle}/{category|item} pages. Prerender only
      // categories + featured items — some of these catalogs are huge (4k+
      // items, many paywalled) and would double the daily build; the rest
      // renders on demand via dynamicParams.
      const handle = entryHandle(registry)
      if (!handle) return []

      const index = await fetchRegistryIndex(registry, 10000)
      if (!index) return []

      const params: { owner: string; repo: string }[] = []
      const categoriesMap = groupItemsByCategory(index.items)

      for (const category of categoriesMap.keys()) {
        params.push({ owner: handle, repo: category })
      }

      const byName = new Map(index.items.map((item) => [item.name, item]))
      for (const name of registry.featured ?? []) {
        const item = byName.get(name)
        if (!item || !hasOnlyRenderableFiles(item.files)) {
          continue
        }
        params.push({ owner: handle, repo: name })
      }

      return params
    })
  )

  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  )
}

export default async function RegistryLandingPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>
}) {
  const { owner, repo } = await params

  // 1) Canonical github pair — always wins
  const ghRegistry = await resolveByGithub(owner, repo)
  if (ghRegistry) {
    const landingData = await loadLandingData(ghRegistry)
    return (
      <RegistryLanding
        registry={ghRegistry}
        basePath={`/${owner}/${repo}`}
        {...landingData}
      />
    )
  }

  // 2) Handle + slug
  const handleRegistry = await resolveByHandle(owner)
  if (!handleRegistry) {
    notFound()
  }

  // Handle alias of a github-backed registry → canonical route
  const gh = parseGithubRef(handleRegistry.github_url)
  if (gh) {
    permanentRedirect(`/${gh.owner}/${gh.repo}/${repo}`)
  }

  // 3) Github-less: `repo` is a category-or-item slug under /{handle}
  return (
    <RegistrySlugView
      registry={handleRegistry}
      basePath={`/${owner}`}
      slug={repo}
    />
  )
}
