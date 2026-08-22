import { Fragment } from "react"
import Link from "next/link"

const LINKS = [
  { href: "/docs", label: "docs" },
  { href: "/about", label: "about" },
  { href: "/privacy", label: "privacy" },
  { href: "/disclosure", label: "affiliates" },
  { href: "https://github.com/rbadillap/registry.directory", label: "github" },
]

export function SiteFooter() {
  return (
    <footer className="text-center pb-6">
      <nav
        aria-label="Site"
        className="text-[11px] font-mono text-neutral-600 flex items-center justify-center gap-3"
      >
        {LINKS.map((link, index) => (
          <Fragment key={link.href}>
            {index > 0 && (
              <span aria-hidden="true" className="text-neutral-700">
                ·
              </span>
            )}
            {link.href.startsWith("http") ? (
              <a
                href={link.href}
                className="hover:text-neutral-400 transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="hover:text-neutral-400 transition-colors"
              >
                {link.label}
              </Link>
            )}
          </Fragment>
        ))}
      </nav>
    </footer>
  )
}
