import Link from "next/link"

const LINKS = [
  { href: "/docs", label: "docs" },
  { href: "/about", label: "about" },
  { href: "/privacy", label: "privacy" },
  { href: "/disclosure", label: "disclosure" },
  { href: "https://github.com/rbadillap/registry.directory", label: "github" },
]

export function SiteFooter() {
  return (
    <footer className="text-center pb-6">
      <nav
        aria-label="Site"
        className="text-[11px] font-mono text-neutral-600 flex items-center justify-center gap-3"
      >
        {LINKS.map((link) =>
          link.href.startsWith("http") ? (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-neutral-400 transition-colors"
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-neutral-400 transition-colors"
            >
              {link.label}
            </Link>
          )
        )}
      </nav>
    </footer>
  )
}
