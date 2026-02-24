import type { Metadata } from "next"
import Link from "next/link"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "registry.directory affiliate disclosure. Some links on this site are affiliate links.",
}

export default function DisclosurePage() {
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
          Affiliate Disclosure
        </h1>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Some links on registry.directory are affiliate links. This means we
            may earn a commission if you make a purchase through those links, at
            no additional cost to you.
          </p>
          <p>
            Affiliate links are always marked with a{" "}
            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 bg-neutral-900 border border-neutral-700/50 px-1.5 py-0.5">
              Sponsored
            </span>{" "}
            label so you can identify them before clicking.
          </p>
          <p>
            Our editorial listings are based on quality, relevance, and
            usefulness to the shadcn/ui community. Affiliate partnerships do not
            influence which registries are listed or how they are described.
          </p>
          <p>
            Revenue from affiliate links helps us maintain and improve
            registry.directory as a free resource.
          </p>
        </div>
      </main>
    </div>
  )
}
