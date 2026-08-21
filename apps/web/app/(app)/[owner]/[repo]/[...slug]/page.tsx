import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { groupItemsByCategory } from "@/lib/registry-mappings"
import { hasOnlyRenderableFiles } from "@/lib/file-utils"
import {
  loadDirectory,
  parseGithubRef,
  resolveByGithub,
  loadRegistryIndex,
} from "@/lib/resolve-registry"
import {
  RegistrySlugView,
  buildSlugMetadata,
} from "@/components/registry-slug-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; repo: string; slug: string[] }>
}): Promise<Metadata> {
  const { owner, repo, slug } = await params
  const name = slug.join("/")
  const registry = await resolveByGithub(owner, repo)

  if (!registry) {
    return { title: "Registry Not Found" }
  }

  return buildSlugMetadata(registry, `/${owner}/${repo}`, name)
}

export async function generateStaticParams() {
  const registries = await loadDirectory()

  const results = await Promise.allSettled(
    registries.map(async (registry) => {
      const gh = parseGithubRef(registry.github_url)
      if (!gh) return []

      const index = await loadRegistryIndex(registry)
      if (!index) return []

      // Categories and featured items are prerendered; the item long tail
      // renders on demand. Measured over 30 days, humans visit ~340 distinct
      // item pages while categories, landings and featured cover ~86% of
      // traffic, and prebaking every item page meant fetching each one from
      // its origin during the build.
      const params: { owner: string; repo: string; slug: string[] }[] = []
      const categoriesMap = groupItemsByCategory(index.items)

      for (const category of categoriesMap.keys()) {
        params.push({ owner: gh.owner, repo: gh.repo, slug: [category] })
      }

      const byName = new Map(index.items.map((item) => [item.name, item]))
      for (const name of registry.featured ?? []) {
        const item = byName.get(name)
        if (!item || !hasOnlyRenderableFiles(item.files)) {
          continue
        }
        // An item name may contain slashes, and each one is a path segment.
        params.push({ owner: gh.owner, repo: gh.repo, slug: name.split("/") })
      }

      return params
    })
  )

  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  )
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string; slug: string[] }>
}) {
  const { owner, repo, slug } = await params

  const registry = await resolveByGithub(owner, repo)
  if (!registry) {
    notFound()
  }

  return (
    <RegistrySlugView
      registry={registry}
      basePath={`/${owner}/${repo}`}
      slug={slug.join("/")}
    />
  )
}
