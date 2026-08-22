import type { Metadata } from "next"
import Link from "next/link"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "About",
  description:
    "What registry.directory is, how registries get admitted, and who maintains it.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <Link
          href="/"
          className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to directory
        </Link>

        <h1 className="text-lg font-semibold mt-8 mb-6">
          About registry.directory
        </h1>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            registry.directory is the discovery layer for the shadcn/ui registry
            ecosystem. It indexes public registries in one place so you — or
            your AI agent — can find the right component across the whole
            ecosystem, preview its source, and install it with the shadcn CLI.
            The official shadcn index answers &quot;does this registry
            exist?&quot;; this site answers &quot;does it resolve, and what is
            actually in it?&quot;.
          </p>
          <p>
            Every listing is audited before admission. The criterion is honest
            resolution, not business model: a registry qualifies when its
            registry.json resolves and its items either ship real installable
            content or clearly declare their gating. Open-source and commercial
            registries are both welcome under that same rule. Anyone can{" "}
            <Link
              href="/docs"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              submit a registry
            </Link>{" "}
            with a single HTTP POST.
          </p>
          <p>
            The site is free to use and machine-friendly by design: the whole
            catalog is published at stable JSON and Markdown URLs, described by
            an OpenAPI spec. Some outbound links are affiliate links — see the{" "}
            <Link
              href="/disclosure"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              affiliate disclosure
            </Link>{" "}
            — and affiliate status never influences what gets listed.
          </p>
          <p>
            registry.directory is built and maintained by{" "}
            <a
              href="https://github.com/rbadillap"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              Ronny Badilla
            </a>
            . The site&apos;s source lives on{" "}
            <a
              href="https://github.com/rbadillap/registry.directory"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              GitHub
            </a>
            . Questions, corrections, or partnership inquiries:{" "}
            <a
              href="mailto:info@ronnybadilla.com"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              info@ronnybadilla.com
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
