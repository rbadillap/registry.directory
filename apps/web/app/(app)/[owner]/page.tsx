import { notFound, permanentRedirect } from "next/navigation"
import type { Metadata } from "next"
import { RegistryLanding } from "@/components/registry-landing/registry-landing"
import { loadLandingData } from "@/lib/landing-data"
import {
  loadDirectory,
  entryHandle,
  parseGithubRef,
  resolveByHandle,
  fetchRegistryIndex,
} from "@/lib/resolve-registry"

// /{handle} — the universal shortlink. handle = namespace minus "@".
// Github-backed entries 308 to their canonical /{owner}/{repo}; github-less
// namespaced entries get their landing right here.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string }>
}): Promise<Metadata> {
  const { owner: handle } = await params
  const registry = await resolveByHandle(handle)

  if (!registry) {
    return { title: "Registry Not Found" }
  }

  // Response is a 308 — skip wasted index fetches at build
  if (parseGithubRef(registry.github_url)) {
    return {}
  }

  const index = await fetchRegistryIndex(registry)
  const itemCount = index?.items?.length || 0
  const canonical = `https://registry.directory/${handle.toLowerCase()}`

  return {
    title: registry.name,
    description: registry.description || `Browse ${itemCount} components from ${registry.name}. Preview code in our IDE viewer and install with one command.`,
    alternates: { canonical },
    openGraph: {
      title: registry.name,
      description: registry.description || `Browse ${itemCount} components from ${registry.name}.`,
      url: canonical,
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
  const registries = await loadDirectory()
  return registries
    .map(entryHandle)
    .filter((handle): handle is string => Boolean(handle))
    .map((handle) => ({ owner: handle }))
}

export default async function HandlePage({
  params,
}: {
  params: Promise<{ owner: string }>
}) {
  const { owner: handle } = await params
  const registry = await resolveByHandle(handle)

  if (!registry) {
    notFound()
  }

  const gh = parseGithubRef(registry.github_url)
  if (gh) {
    permanentRedirect(`/${gh.owner}/${gh.repo}`)
  }

  const landingData = await loadLandingData(registry)
  return (
    <RegistryLanding
      registry={registry}
      basePath={`/${entryHandle(registry)}`}
      {...landingData}
    />
  )
}
