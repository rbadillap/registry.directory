import { NextRequest } from "next/server"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { DirectoryEntry } from "@/lib/types"
import type { Registry, RegistryItem } from "@/lib/registry-types"
import { registryFetch } from "@/lib/fetch-utils"
import { generateMarkdownForItem } from "@/lib/markdown-generator"
import { groupItemsByCategory } from "@/lib/registry-mappings"

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

async function fetchItemData(
  registry: DirectoryEntry,
  itemName: string
): Promise<RegistryItem | null> {
  let baseUrl: string
  if (registry.registry_url) {
    baseUrl = registry.registry_url.replace(/\/[^/]+\.json$/, '')
  } else {
    baseUrl = `${registry.url.replace(/\/$/, '')}/r`
  }
  const targetUrl = `${baseUrl}/${itemName}.json`

  try {
    const response = await registryFetch(targetUrl, {
      timeout: 5000,
      next: { revalidate: 3600 }
    })

    if (!response.ok) return null

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`[Markdown API] Error fetching item:`, error)
    return null
  }
}

export async function generateStaticParams() {
  const filePath = join(process.cwd(), "public/directory.json")
  const fileContents = await readFile(filePath, "utf8")
  const data = JSON.parse(fileContents) as { registries: DirectoryEntry[] }
  const registries = data.registries

  const params: { owner: string; repo: string; category: string; item: string }[] = []

  for (const registry of registries) {
    if (!registry.github_url) continue

    const match = registry.github_url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) continue

    const owner = match[1]
    const repo = match[2]?.replace(/\.git$/, '')

    if (!owner || !repo) continue

    // Fetch registry data to get all items
    try {
      const targetUrl = registry.registry_url || `${registry.url.replace(/\/$/, '')}/r/registry.json`
      const response = await registryFetch(targetUrl, {
        timeout: 10000,
        next: { revalidate: 3600 }
      })

      if (!response.ok) continue

      const registryData = await response.json() as Registry
      const categoriesMap = groupItemsByCategory(registryData.items)

      // Generate params for each category/item combination
      for (const [category, items] of categoriesMap.entries()) {
        for (const item of items) {
          params.push({
            owner,
            repo,
            category,
            item: item.name
          })
        }
      }
    } catch (error) {
      console.error(`[Markdown API] Error generating params for ${owner}/${repo}:`, error)
    }
  }

  return params
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; category: string; item: string }> }
) {
  const { owner, repo, category, item } = await params

  const registry = await getRegistry(owner, repo)
  if (!registry) {
    return new Response("Registry not found", { status: 404 })
  }

  const itemData = await fetchItemData(registry, item)
  if (!itemData) {
    return new Response("Item not found", { status: 404 })
  }

  const markdown = generateMarkdownForItem(itemData, registry, owner, repo, category)

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    }
  })
}
