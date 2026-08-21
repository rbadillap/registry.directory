/* eslint-disable react/no-unknown-property */
import { slugFromSegments } from "@/lib/route-utils"
import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { typeToSlug, REGISTRY_TYPE_LABELS, isCategory } from "@/lib/registry-mappings"
import { getInstallCommand } from "@/lib/install-command"
import { resolveByGithub, loadRegistryIndex } from "@/lib/resolve-registry"

// A route handler rather than an opengraph-image file convention: the item
// route is a catch-all, and a catch-all segment consumes everything after it,
// so no static child can live under it. The URL is emitted by
// buildSlugMetadata instead of being inferred from the file's position.
export const runtime = 'nodejs'

const SIZE = { width: 1200, height: 630 }


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ owner: string; repo: string; slug: string[] }> }
) {
  const { owner, repo, slug: segments } = await params
  const slug = slugFromSegments(segments)

  const [dmSansRegular, dmSansMedium, ibmPlexMono] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/DMSans-Regular.ttf')),
    readFile(join(process.cwd(), 'public/fonts/DMSans-Medium.ttf')),
    readFile(join(process.cwd(), 'public/fonts/IBMPlexMono-Regular.ttf'))
  ])

  const registry = await resolveByGithub(owner, repo)
  const registryIndex = registry ? await loadRegistryIndex(registry) : null

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
        ...SIZE,
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
      ...SIZE,
      fonts: [
        { name: "DM Sans", data: dmSansRegular, style: "normal", weight: 400 },
        { name: "DM Sans", data: dmSansMedium, style: "normal", weight: 500 },
        { name: "IBM Plex Mono", data: ibmPlexMono, style: "normal", weight: 400 },
      ],
    }
  )
}
