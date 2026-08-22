import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { DirectoryEntry } from "@/lib/types"

// Read local directory.json at build time. No remote fetches, so this can be
// fully static.
export const dynamic = "force-static"
export const revalidate = 86400

const BASE_URL = "https://registry.directory"

// Resolve a registry's canonical registry.directory path: /{owner}/{repo}
// from github_url, else /{handle} from the namespace. Falls back to the
// registry's own site when neither exists.
function registryLink(registry: DirectoryEntry): string {
  if (registry.github_url) {
    const match = registry.github_url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (match && match[1] && match[2]) {
      const owner = match[1]
      const repo = match[2].replace(/\.git$/, "")
      return `${BASE_URL}/${owner}/${repo}`
    }
  }
  if (registry.namespace) {
    return `${BASE_URL}/${registry.namespace.replace(/^@/, "")}`
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
    `> The discovery layer for the shadcn/ui registry ecosystem. Browse, search, and compare components across ${registries.length} public registries, then install them with the shadcn CLI. A static site, rebuilt when the catalog changes.`
  )
  lines.push("")
  lines.push(
    "registry.directory indexes shadcn/ui registries so an agent can find the right component across the **whole ecosystem** — not just the registries already configured in a project's `components.json`. Use it to discover *which* registry has what you need; use the shadcn CLI (or shadcn's own MCP server) to install it."
  )
  lines.push("")

  lines.push("## When to use registry.directory")
  lines.push("")
  lines.push(
    "- **You need a component and don't know which registry has it.** Search the cross-registry index instead of guessing: `" +
      BASE_URL +
      "/items.json` lists every item with its type, description, and registry."
  )
  lines.push(
    "- **You need a component's full source and dependencies.** Fetch it as one Markdown document (see the endpoint below) instead of crawling the origin registry file by file."
  )
  lines.push(
    "- **You maintain a shadcn registry and want it listed.** Submit it with one HTTP POST — see \"Submitting a registry\" below."
  )
  lines.push(
    "- **Not for installation.** Once you know which registry has what you need, install with the shadcn CLI against that registry."
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
  lines.push(
    `- **Cross-registry item index:** \`${BASE_URL}/items.json\` — every component across every registry, with its type and description.`
  )
  lines.push(
    `- **Markdown alias:** append \`.md\` to any item page URL (\`${BASE_URL}/{owner}/{repo}/{slug}.md\`) for the same Markdown view.`
  )
  lines.push(
    `- **API contract:** \`${BASE_URL}/openapi.json\` — OpenAPI 3.1 description of every endpoint above plus the submission API. Human-readable overview at \`${BASE_URL}/docs\`.`
  )
  lines.push("")

  lines.push("## Submitting a registry")
  lines.push("")
  lines.push(
    "You (or your agent) can submit a shadcn registry with a single HTTP POST — no account, no fork, no PR. The prompt `submit my registry to registry.directory` is enough for an agent: the full contract lives at `" +
      BASE_URL +
      "/how-to-submit.md` (prerequisites, fields, responses, updates) and `" +
      BASE_URL +
      "/openapi.json` (the `POST /api/submit` operation). Every submission is audited before listing: the registry.json and several items are fetched and must resolve with real installable content."
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
