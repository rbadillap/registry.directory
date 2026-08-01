/* eslint-disable react/no-unknown-property */
import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { typeToSlug, SLUG_TO_REGISTRY_TYPE, REGISTRY_TYPE_LABELS } from "@/lib/registry-mappings"
import { getInstallCommand } from "@/lib/install-command"
import { resolveByGithub, fetchRegistryIndex } from "@/lib/resolve-registry"

export const runtime = 'nodejs'
export const alt = 'registry.directory component preview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'


function isCategory(slug: string): boolean {
  return slug in SLUG_TO_REGISTRY_TYPE
}

export default async function Image({
  params,
}: {
  params: Promise<{ owner: string; repo: string; slug: string }>
}) {
  const { owner, repo, slug } = await params

  const [dmSansRegular, dmSansMedium, ibmPlexMono] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/DMSans-Regular.ttf')),
    readFile(join(process.cwd(), 'public/fonts/DMSans-Medium.ttf')),
    readFile(join(process.cwd(), 'public/fonts/IBMPlexMono-Regular.ttf'))
  ])

  const registry = await resolveByGithub(owner, repo)
  const registryIndex = registry ? await fetchRegistryIndex(registry, 10000) : null

  // Category OG image
  if (isCategory(slug)) {
    const categoryLabel = REGISTRY_TYPE_LABELS[slug] || slug
    const categoryItems = registryIndex?.items?.filter(item => typeToSlug(item.type) === slug)
    const itemCount = categoryItems?.length || 0

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

            <p tw="text-xl text-stone-400 mb-4">
              {registry?.name || `${owner}/${repo}`}
            </p>

            {itemCount > 0 && (
              <div tw="flex items-center bg-stone-900 border border-stone-800 rounded-lg px-4 py-2 mt-4">
                <span tw="text-white font-medium mr-2">{itemCount}</span>
                <span tw="text-stone-400">{itemCount === 1 ? 'registry item' : 'registry items'}</span>
              </div>
            )}

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

  // Item OG image - reuse registryIndex from above
  const itemData = registryIndex?.items?.find(item => item.name === slug)
  const categorySlug = itemData ? typeToSlug(itemData.type) : null
  const categoryLabel = categorySlug ? (REGISTRY_TYPE_LABELS[categorySlug] || categorySlug) : "Component"

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
            <span tw="text-white ml-2">{
              registry
                ? getInstallCommand({ registry, itemName: slug, basePath: `/${owner}/${repo}` })
                : slug
            }</span>
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
