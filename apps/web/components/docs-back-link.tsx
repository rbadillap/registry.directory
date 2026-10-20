"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

// Where the reader came from, when a link on this site sent them here with
// ?from= — the Preview help on an item page does. Only a path on this site
// is honoured; anything else falls back to the directory.
function returnPath(): { href: string; label: string } | null {
  const params = new URLSearchParams(window.location.search)
  const from = params.get("from")
  if (!from || !from.startsWith("/") || from.startsWith("//") || from.startsWith("/\\")) {
    return null
  }
  const label = params.get("label")?.slice(0, 80) || "the previous page"
  return { href: from, label }
}

export function DocsBackLink() {
  // Read after mount: the page is static, and the query string only exists
  // in the browser.
  const [back, setBack] = useState<{ href: string; label: string } | null>(null)
  useEffect(() => setBack(returnPath()), [])

  return (
    <Link
      href={back?.href ?? "/"}
      className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
    >
      &larr; Back to {back ? back.label : "directory"}
    </Link>
  )
}
