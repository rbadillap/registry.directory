import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { groupItemsByCategory } from "@/lib/registry-mappings"
import { hasOnlyRenderableFiles } from "@/lib/file-utils"
import {
  loadDirectory,
  parseGithubRef,
  resolveByGithub,
  fetchRegistryIndex,
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

      const index = await fetchRegistryIndex(registry, 10000)
      if (!index) return []

      const params: { owner: string; repo: string; slug: string }[] = []
      const categoriesMap = groupItemsByCategory(index.items)

      for (const category of categoriesMap.keys()) {
        params.push({ owner: gh.owner, repo: gh.repo, slug: category })
      }

      for (const item of index.items) {
        if (!hasOnlyRenderableFiles(item.files)) {
          continue
        }
        params.push({ owner: gh.owner, repo: gh.repo, slug: item.name })
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
