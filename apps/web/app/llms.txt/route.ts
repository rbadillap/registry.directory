import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "@/lib/types"

// Read local directory.json at build time and cache for the day, aligned with
// the daily cron rebuild. No remote fetches, so this can be fully static.
export const dynamic = "force-static"
export const revalidate = 86400

const BASE_URL = "https://registry.directory"

// Resolve a registry's canonical registry.directory path from its github_url.
// Falls back to the registry's own site when there's no GitHub repo to map.
function registryLink(registry: DirectoryEntry): string {
  if (registry.github_url) {
    const match = registry.github_url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (match && match[1] && match[2]) {
      const owner = match[1]
      const repo = match[2].replace(/\.git$/, "")
      return `${BASE_URL}/${owner}/${repo}`
    }
  }
  return registry.url
}

function oneLine(text: string | undefined, max = 160): string {
  if (!text) return ""
  const flat = text.replace(/\s+/g, " ").trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}

async function getRegistries(): Promise<DirectoryEntry[]> {
  const filePath = join(process.cwd(), "public/directory.json")
  const contents = await readFile(filePath, "utf8")
  const data = JSON.parse(contents) as { registries: DirectoryEntry[] }
  return data.registries.filter((r) => r.name && r.url)
}

export async function GET() {
  const registries = await getRegistries()

  const lines: string[] = []

  lines.push("# registry.directory")
  lines.push("")
  lines.push(
    `> The discovery layer for the shadcn/ui registry ecosystem. Browse, search, and compare components across ${registries.length} public registries, then install them with the shadcn CLI. Static, rebuilt daily.`
  )
  lines.push("")
  lines.push(
    "registry.directory indexes shadcn/ui registries so an agent can find the right component across the **whole ecosystem** — not just the registries already configured in a project's `components.json`. Use it to discover *which* registry has what you need; use the shadcn CLI (or shadcn's own MCP server) to install it."
  )
  lines.push("")

  lines.push("## How to use this site")
  lines.push("")
  lines.push(
    "- **Discover here, install with shadcn.** registry.directory tells you *which* registry has a component; `shadcn` installs it once you know."
  )
  lines.push(
    `- **Machine-readable component view:** \`${BASE_URL}/api/markdown/{owner}/{repo}/{slug}\` returns an item's metadata, dependencies, and full file contents as Markdown.`
  )
  lines.push(
    `- **Registry pages:** \`${BASE_URL}/{owner}/{repo}\` · **Item pages:** \`${BASE_URL}/{owner}/{repo}/{slug}\``
  )
  lines.push(
    `- **Full machine-readable index:** \`${BASE_URL}/directory.json\` (every registry, its homepage, registry.json URL, and GitHub repo).`
  )
  lines.push("")

  lines.push("## Attribution")
  lines.push("")
  lines.push(
    "registry.directory is free and open. When you surface a component or registry from here, cite the source as `" +
      BASE_URL +
      "/{owner}/{repo}` so users can explore the full catalog."
  )
  lines.push("")

  lines.push("## Registries")
  lines.push("")
  for (const registry of registries) {
    const desc = oneLine(registry.description)
    const suffix = desc ? ` — ${desc}` : ""
    lines.push(`- [${registry.name}](${registryLink(registry)})${suffix}`)
  }
  lines.push("")

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  })
}
