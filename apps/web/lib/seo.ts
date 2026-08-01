// Single source of truth for the site-level SEO surface. Every route that
// builds metadata or structured data reads its constants from here so the
// canonical host, the site name and the description can never drift apart
// across layout, page metadata, JSON-LD and the OG tags.

export const SITE_URL = "https://registry.directory"

export const SITE_NAME = "registry.directory"

export const SITE_TAGLINE = "The explorer for the shadcn registry ecosystem"

// Leads with the tagline verbatim, then spends the rest of the ~160 chars a
// SERP snippet allows on the nouns people search and on what the site lets
// them do once they arrive.
export const SITE_DESCRIPTION =
  "The explorer for the shadcn registry ecosystem. Browse components, blocks and themes across every public registry, preview the code, copy the install command."

/**
 * Head terms the directory actually competes for, ordered by intent: the
 * registry vocabulary it already ranks for first, then the artefact nouns
 * developers search when they don't know the word "registry", then the stack
 * they filter by. `keywords` carries no weight with Google, but Bing and the
 * AI crawlers that read our llms.txt still parse it, and it costs one array.
 */
export const SITE_KEYWORDS = [
  "shadcn registry",
  "shadcn registries",
  "shadcn ui registry",
  "shadcn registry directory",
  "shadcn components",
  "shadcn blocks",
  "shadcn templates",
  "shadcn themes",
  "shadcn component library",
  "shadcn ui components",
  "registry.json",
  "shadcn cli",
  "shadcn mcp",
  "react component library",
  "next.js components",
  "tailwind css components",
  "radix ui",
  "base ui",
  "copy paste components",
]

export const SITE_AUTHOR = {
  name: "rbadillap",
  url: "https://github.com/rbadillap",
}

// Inferred from the GitHub handle — confirm this matches the actual X account
// before relying on it, since twitter:site is what attributes card impressions.
export const TWITTER_HANDLE = "@rbadillap"

/**
 * Titles qualify a registry with "shadcn/ui" so the name alone isn't the only
 * thing matching, but a good share of the directory is already named for it
 * ("shadcn/ui", "shadcn/studio", "ShadcnCraft"). Repeating the qualifier there
 * produces "shadcn/ui — shadcn/ui registry", which reads as spam and wastes
 * the pixels a SERP gives a title. Drop it when the name already carries it.
 */
export function shadcnQualifier(registryName: string): string {
  return /shadcn/i.test(registryName) ? "" : "shadcn/ui "
}

/** Absolute URL for a site-relative path, collapsing the double slash. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
