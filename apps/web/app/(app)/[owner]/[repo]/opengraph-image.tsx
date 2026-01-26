/* eslint-disable react/no-unknown-property */
import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "@/lib/types"
import type { Registry } from "@/lib/registry-types"
import { registryFetch } from "@/lib/fetch-utils"
import { groupItemsByCategory } from "@/lib/registry-mappings"

export const runtime = 'nodejs'
export const alt = 'registry.directory registry preview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

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
  } catch {
    return null
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>
}) {
  const { owner, repo } = await params

  const [dmSansRegular, dmSansMedium] = await Promise.all([
    readFile(join(process.cwd(), 'assets/DMSans-Regular.ttf')),
    readFile(join(process.cwd(), 'assets/DMSans-Medium.ttf'))
  ])

  const registry = await getRegistry(owner, repo)
  const registryData = registry ? await fetchRegistryData(registry) : null

  const itemCount = registryData?.items?.length || 0
  const categoriesMap = registryData?.items ? groupItemsByCategory(registryData.items) : new Map()
  const categoryCount = categoriesMap.size

  return new ImageResponse(
    (
      <div
        tw="flex flex-col items-center justify-center w-full h-full bg-black"
        style={{
          fontFamily: 'DM Sans',
          background: 'linear-gradient(to bottom right, #000000, #111111)',
        }}
      >
        <div tw="flex border absolute border-stone-700/50 border-dashed inset-y-0 left-16 w-[1px]" />
        <div tw="flex border absolute border-stone-700/50 border-dashed inset-y-0 right-16 w-[1px]" />
        <div tw="flex border absolute border-stone-700/50 inset-x-0 h-[1px] top-16" />
        <div tw="flex border absolute border-stone-700/50 inset-x-0 h-[1px] bottom-16" />

        <div tw="flex flex-col items-center">
          <h1
            tw="text-white font-medium text-5xl mb-4"
            style={{ fontFamily: 'DM Sans', fontWeight: 500 }}
          >
            {registry?.name || `${owner}/${repo}`}
          </h1>

          {registry?.description && (
            <p tw="text-xl text-stone-400 mb-6 max-w-2xl text-center px-8">
              {registry.description}
            </p>
          )}

          <div tw="flex items-center mt-4">
            {itemCount > 0 && (
              <div tw="flex items-center bg-stone-900 border border-stone-800 rounded-lg px-4 py-2 mx-2">
                <span tw="text-white font-medium mr-2">{itemCount}</span>
                <span tw="text-stone-400">components</span>
              </div>
            )}
            {categoryCount > 0 && (
              <div tw="flex items-center bg-stone-900 border border-stone-800 rounded-lg px-4 py-2 mx-2">
                <span tw="text-white font-medium mr-2">{categoryCount}</span>
                <span tw="text-stone-400">categories</span>
              </div>
            )}
          </div>

          <div tw="flex items-center mt-12">
            <span tw="text-stone-500 text-lg">registry</span>
            <span tw="text-stone-600 text-lg">.directory</span>
          </div>
        </div>

        <div
          tw="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)',
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "DM Sans", data: dmSansRegular, style: "normal", weight: 400 },
        { name: "DM Sans", data: dmSansMedium, style: "normal", weight: 500 },
      ],
    }
  )
}
