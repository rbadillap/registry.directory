import type { Metadata } from "next"
import Link from "next/link"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What registry.directory collects, what it stores, and what it never does with your data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <Link
          href="/"
          className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to directory
        </Link>

        <h1 className="text-lg font-semibold mt-8 mb-6">Privacy</h1>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            registry.directory works without accounts, logins, or tracking
            cookies. You can browse the entire site — and agents can consume
            every machine-readable surface — without identifying yourself.
          </p>
          <p>
            <span className="text-foreground">Analytics.</span> The site uses
            Vercel Web Analytics, which reports aggregate page views and
            visitor counts without cookies or cross-site tracking. We see which
            pages and searches are popular; we do not see who you are.
          </p>
          <p>
            <span className="text-foreground">Submissions.</span> When you
            submit a registry through the submission API, the fields you send
            (registry name, description, URLs, and optional metadata) are
            stored so a maintainer can review them. Submissions describe public
            registries, not people — send only information you intend to be
            published if the registry is admitted.
          </p>
          <p>
            <span className="text-foreground">Feedback.</span> When you use the
            feedback widget, we store your message together with the page it
            was sent from and your browser&apos;s user-agent string, so we can
            reproduce what you reported. Feedback is never published.
          </p>
          <p>
            <span className="text-foreground">What we never do.</span> No data
            is sold or shared with advertisers. No advertising or cross-site
            tracking scripts run on this site. Outbound affiliate links are
            marked as such — see the{" "}
            <Link
              href="/disclosure"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              affiliate disclosure
            </Link>
            .
          </p>
          <p>
            To ask about or request removal of anything you submitted, write to{" "}
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
