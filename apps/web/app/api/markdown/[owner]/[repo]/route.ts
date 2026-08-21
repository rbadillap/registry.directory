import { NextRequest } from "next/server"
import { generateMarkdownForItem } from "@/lib/markdown-generator"
import { resolveByHandle, parseGithubRef, entryHandle } from "@/lib/resolve-registry"
import { isCategory } from "@/components/registry-slug-view"
import { fetchItemData } from "@/lib/registry-item-source"

// Markdown export for handle-based item URLs: /{handle}/{item}.md
// (github-backed registries use the 3-segment route)
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner: handle, repo: slug } = await params

  // Categories don't have markdown
  if (isCategory(slug)) {
    return new Response("Markdown not available for categories", { status: 404 })
  }

  const registry = await resolveByHandle(handle)
  if (!registry || parseGithubRef(registry.github_url)) {
    return new Response("Registry not found", { status: 404 })
  }

  const itemData = await fetchItemData(registry, slug)
  if (!itemData) {
    return new Response("Item not found", { status: 404 })
  }

  const markdown = generateMarkdownForItem(itemData, registry, `/${entryHandle(registry)}`)

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    }
  })
}
