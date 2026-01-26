/* eslint-disable react/no-unknown-property */
import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "@/lib/types"
import type { Registry } from "@/lib/registry-types"
import { registryFetch } from "@/lib/fetch-utils"
import { typeToSlug, SLUG_TO_REGISTRY_TYPE } from "@/lib/registry-mappings"

export const runtime = 'nodejs'
export const alt = 'registry.directory component preview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

const CATEGORY_LABELS: Record<string, string> = {
  ui: "UI Components",
  blocks: "Blocks",
  components: "Components",
  hooks: "Hooks",
  lib: "Libraries",
  pages: "Pages",
  themes: "Themes",
  styles: "Styles",
  examples: "Examples",
  base: "Base",
}

function isCategory(slug: string): boolean {
  return slug in SLUG_TO_REGISTRY_TYPE
}

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

async function fetchRegistryIndex(registry: DirectoryEntry): Promise<Registry | null> {
  const targetUrl = registry.registry_url || `${registry.url.replace(/\/$/, '')}/r/registry.json`

  try {
    const response = await registryFetch(targetUrl, {
      timeout: 10000,
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
  params: Promise<{ owner: string; repo: string; slug: string }>
}) {
  const { owner, repo, slug } = await params

  const [dmSansRegular, dmSansMedium, ibmPlexMono] = await Promise.all([
    readFile(join(process.cwd(), 'assets/DMSans-Regular.ttf')),
    readFile(join(process.cwd(), 'assets/DMSans-Medium.ttf')),
    readFile(join(process.cwd(), 'assets/IBMPlexMono-Regular.ttf'))
  ])

  const registry = await getRegistry(owner, repo)

  // Category OG image
  if (isCategory(slug)) {
    const categoryLabel = CATEGORY_LABELS[slug] || slug

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
              {categoryLabel}
            </h1>

            <p tw="text-xl text-stone-400 mb-8">
              {owner}/{repo}
            </p>

            <div tw="flex items-center mt-8">
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

  // Item OG image - use registry index instead of individual fetch to avoid timeout during build
  const registryIndex = registry ? await fetchRegistryIndex(registry) : null
  const itemData = registryIndex?.items?.find(item => item.name === slug)
  const categorySlug = itemData ? typeToSlug(itemData.type) : null
  const categoryLabel = categorySlug ? (CATEGORY_LABELS[categorySlug] || categorySlug) : "Component"

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
          <div
            tw="text-sm text-stone-400 rounded-full border border-stone-700 px-4 py-1 mb-4"
            style={{ fontWeight: 400 }}
          >
            {categoryLabel}
          </div>

          <h1
            tw="text-white font-medium text-5xl mb-4"
            style={{ fontFamily: 'DM Sans', fontWeight: 500 }}
          >
            {slug}
          </h1>

          <p tw="text-xl text-stone-400 mb-8">
            {owner}/{repo}
          </p>

          <div
            tw="flex items-center bg-stone-900 border border-stone-800 rounded-lg px-6 py-3"
            style={{ fontFamily: 'IBM Plex Mono' }}
          >
            <span tw="text-stone-500 mr-2">$</span>
            <span tw="text-stone-300">npx shadcn@latest add</span>
            <span tw="text-white ml-2">{registry?.url ? `${registry.url}/${slug}` : slug}</span>
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
        { name: "IBM Plex Mono", data: ibmPlexMono, style: "normal", weight: 400 },
      ],
    }
  )
}
