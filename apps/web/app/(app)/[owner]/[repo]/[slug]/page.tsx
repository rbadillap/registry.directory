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
  params: Promise<{ owner: string; repo: string; slug: string }>
}): Promise<Metadata> {
  const { owner, repo, slug } = await params
  const registry = await resolveByGithub(owner, repo)

  if (!registry) {
    return { title: "Registry Not Found" }
  }

  return buildSlugMetadata(registry, `/${owner}/${repo}`, slug)
}

export async function generateStaticParams() {
  const registries = await loadDirectory()

  const results = await Promise.allSettled(
    registries.map(async (registry) => {
      const gh = parseGithubRef(registry.github_url)
      if (!gh) return []

      const index = await loadRegistryIndex(registry)
      if (!index) return []

      // Prerender only categories + featured items; the item long tail
      // renders on demand via dynamicParams. Measured over 30 days, humans
      // visit ~340 distinct item pages while categories, landings and
      // featured cover ~86% of traffic — prebaking all ~19k item pages
      // spent the whole build on pages nobody requests before they expire.
      const params: { owner: string; repo: string; slug: string }[] = []
      const categoriesMap = groupItemsByCategory(index.items)

      for (const category of categoriesMap.keys()) {
        params.push({ owner: gh.owner, repo: gh.repo, slug: category })
      }

      const byName = new Map(index.items.map((item) => [item.name, item]))
      for (const name of registry.featured ?? []) {
        const item = byName.get(name)
        if (!item || !hasOnlyRenderableFiles(item.files)) {
          continue
        }
        params.push({ owner: gh.owner, repo: gh.repo, slug: name })
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
  params: Promise<{ owner: string; repo: string; slug: string }>
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
      slug={slug}
    />
  )
}
