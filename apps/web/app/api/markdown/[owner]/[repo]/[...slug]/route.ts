import { isCategory } from "@/lib/registry-mappings"
import { slugFromSegments } from "@/lib/route-utils"
import { NextRequest } from "next/server"
import { generateMarkdownForItem } from "@/lib/markdown-generator"
import { resolveByGithub } from "@/lib/resolve-registry"
import { fetchItemData } from "@/lib/registry-item-source"

// Force dynamic rendering - don't pre-generate during build
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; slug: string[] }> }
) {
  const { owner, repo, slug: segments } = await params
  // An item name may contain slashes; each one arrives as its own segment.
  const slug = slugFromSegments(segments)

  // Categories don't have markdown
  if (isCategory(slug)) {
    return new Response("Markdown not available for categories", { status: 404 })
  }

  const registry = await resolveByGithub(owner, repo)
  if (!registry) {
    return new Response("Registry not found", { status: 404 })
  }

  const itemData = await fetchItemData(registry, slug)
  if (!itemData) {
    return new Response("Item not found", { status: 404 })
  }

  const markdown = generateMarkdownForItem(itemData, registry, `/${owner}/${repo}`)

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    }
  })
}
