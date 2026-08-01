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
import { JsonLd } from "@/components/json-ld"
import {
  buildBreadcrumbSchema,
  buildRegistryCollectionSchema,
} from "@/lib/structured-data"
import { SITE_NAME, TWITTER_HANDLE, shadcnQualifier } from "@/lib/seo"

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

    // Qualify the bare registry name with what it is and how many pieces it
    // ships — "acme" alone matches nothing, "acme — 42 shadcn/ui components"
    // matches the way people actually phrase the search.
    const qualifier = shadcnQualifier(ghRegistry.name)
    const title = itemCount
      ? `${ghRegistry.name} — ${itemCount} ${qualifier}components & blocks`
      : `${ghRegistry.name} — ${qualifier}registry`
    const description =
      ghRegistry.description ||
      `Browse ${itemCount} shadcn/ui components from ${ghRegistry.name}. Preview the source in an IDE viewer and install with the shadcn CLI.`

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: SITE_NAME,
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        site: TWITTER_HANDLE,
        title,
        description,
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
      // categories + featured items, same policy as the github-backed
      // [slug] route; the rest renders on demand via dynamicParams.
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
    const basePath = `/${owner}/${repo}`
    const landingData = await loadLandingData(ghRegistry)
    const index = await fetchRegistryIndex(ghRegistry)
    const items = index?.items ?? []

    return (
      <>
        <JsonLd
          data={[
            buildBreadcrumbSchema([
              { name: ghRegistry.name, path: basePath },
            ]),
            buildRegistryCollectionSchema({
              registry: ghRegistry,
              basePath,
              itemNames: items.map((item) => item.name),
              totalItems: items.length,
            }),
          ]}
        />
        <RegistryLanding
          registry={ghRegistry}
          basePath={basePath}
          {...landingData}
        />
      </>
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
