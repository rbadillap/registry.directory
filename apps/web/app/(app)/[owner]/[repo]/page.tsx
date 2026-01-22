import { notFound } from "next/navigation"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { RegistryViewer } from "@/components/registry-viewer"
import { DirectoryEntry } from "@/lib/types"
import type { Registry } from "@/lib/registry-types"

async function getRegistry(owner: string, repo: string) {
  const filePath = join(process.cwd(), "public/registries.json")
  const fileContents = await readFile(filePath, "utf8")
  const registries = JSON.parse(fileContents) as DirectoryEntry[]

  // Find registry by matching github_url pattern
  return registries.find((r) => {
    if (!r.github_url) return false

    const match = r.github_url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) return false

    const registryOwner = match[1]
    const registryRepo = match[2]?.replace(/\.git$/, '')

    return registryOwner === owner && registryRepo === repo
  }) || null
}

async function fetchRegistryData(registry: DirectoryEntry): Promise<Registry | null> {
  try {
    // Use custom registry_url if provided, otherwise construct standard URL
    const targetUrl = registry.registry_url || `${registry.url.replace(/\/$/, '')}/r/registry.json`

    // Attempt to fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      next: { revalidate: 3600 } // ISR: cache for 1 hour
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    // Timeout, network error, or invalid JSON
    return null
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

export default async function RegistryPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>
}) {
  const { owner, repo } = await params
  const registry = await getRegistry(owner, repo)

  if (!registry) {
    notFound()
  }

  // Attempt to fetch registry data from registry_url or /r/registry.json
  const registryData = await fetchRegistryData(registry)

  // If no registry data available, it's a 404
  if (!registryData) {
    notFound()
  }

  return <RegistryViewer registry={registry} registryData={registryData} />
}
