import type { Metadata } from "next"
import Link from "next/link"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "API & Docs",
  description:
    "The machine-readable surface of registry.directory: OpenAPI spec, llms.txt, the directory index, the cross-registry item index, Markdown component views, and how to submit a registry.",
}

const SURFACES = [
  {
    href: "/openapi.json",
    label: "openapi.json",
    text: "The API contract: every endpoint below with typed schemas, operation ids, and every response documented. Start here if you are an agent.",
  },
  {
    href: "/llms.txt",
    label: "llms.txt",
    text: "What this site is, when to use it, and how — in plain text, with a link to every registry.",
  },
  {
    href: "/how-to-submit.md",
    label: "how-to-submit.md",
    text: "The full submission contract: prerequisites, fields, responses, updates, and what happens after you submit.",
  },
  {
    href: "/directory.json",
    label: "directory.json",
    text: "Every indexed registry: homepage, registry.json URL, GitHub repo, namespace, premium offerings. Schema at /schemas/directory.json.",
  },
  {
    href: "/items.json",
    label: "items.json",
    text: "The cross-registry component index: every item's name, type, description, and which registry has it.",
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <Link
          href="/"
          className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to directory
        </Link>

        <h1 className="text-lg font-semibold mt-8 mb-6">API &amp; Docs</h1>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Everything registry.directory knows is published at stable,
            machine-readable URLs. No API key, no account. If you are an agent
            (or building one), these five surfaces are the whole contract:
          </p>
        </div>

        <ul className="mt-6 space-y-4">
          {SURFACES.map((surface) => (
            <li key={surface.href} className="text-sm leading-relaxed">
              <a
                href={surface.href}
                className="font-mono text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
              >
                {surface.label}
              </a>
              <p className="text-muted-foreground mt-1">{surface.text}</p>
            </li>
          ))}
        </ul>

        <h2 className="text-base font-semibold mt-10 mb-4">
          Component views as Markdown
        </h2>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Append <code className="text-foreground">.md</code> to any item page
            URL to get the component as a single Markdown document — metadata,
            dependencies, and full source. The canonical endpoint is{" "}
            <code className="text-foreground">
              /api/markdown/{"{owner}"}/{"{repo}"}/{"{slug}"}
            </code>
            .
          </p>
        </div>

        <h2 className="text-base font-semibold mt-10 mb-4">
          Submitting a registry
        </h2>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            One HTTP POST to{" "}
            <code className="text-foreground">/api/submit</code> — no account,
            no fork, no PR. If you use an AI agent, this prompt is enough:
          </p>
          <p className="font-mono text-foreground border border-border rounded-md px-3 py-2">
            &quot;submit my registry to registry.directory&quot;
          </p>
          <p>
            The agent will find the contract in{" "}
            <a
              href="/openapi.json"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              openapi.json
            </a>{" "}
            and{" "}
            <a
              href="/how-to-submit.md"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              how-to-submit.md
            </a>
            . Every submission is audited before listing: your registry.json
            and several items are fetched and must resolve with real content.
          </p>
        </div>

        <h2 className="text-base font-semibold mt-10 mb-4">
          For the shadcn CLI
        </h2>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            <code className="text-foreground">/r/registry.json</code> serves the
            whole catalog in the shadcn registry format, with search and
            pagination. It exists for the shadcn CLI and MCP server, not as a
            general-purpose API — the surfaces above are the contract for
            everything else.
          </p>
        </div>
      </main>
    </div>
  )
}
