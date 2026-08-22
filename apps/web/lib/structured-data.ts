// JSON-LD builders. Each returns a plain schema.org node; routes hand the
// result to <JsonLd> to serialise it. Kept free of React so metadata code and
// route components can share the same shapes.
//
// Type choices, and why:
//   WebSite + SearchAction  — declares the site's own search endpoint (`?q=`)
//   Organization            — binds the brand to its GitHub/social profiles
//   BreadcrumbList          — swaps the raw URL in the SERP for a trail
//   CollectionPage/ItemList — a registry landing is an enumerable collection
//   SoftwareSourceCode      — an item page *is* source code, not an article
//
// Deliberately absent: FAQPage. Google restricted it to recognised-authority
// sites in 2023, so emitting it buys nothing and adds markup to maintain.

import type { DirectoryEntry } from "@/lib/types"
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  shadcnQualifier,
} from "@/lib/seo"

type JsonLdNode = Record<string, unknown>

const SCHEMA = "https://schema.org"

/** Drop undefined/empty values so we never emit a null-valued schema key. */
function compact(node: JsonLdNode): JsonLdNode {
  return Object.fromEntries(
    Object.entries(node).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0)
    )
  )
}

/**
 * The site node, with the search endpoint the home page already implements via
 * the `q` param. Whether Google renders a sitelinks searchbox is its call, but
 * the declaration is a prerequisite for it ever happening.
 */
export function buildWebSiteSchema(): JsonLdNode {
  return {
    "@context": SCHEMA,
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: "shadcn registry directory",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function buildOrganizationSchema(): JsonLdNode {
  return {
    "@context": SCHEMA,
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: absoluteUrl("/icon"),
    email: "info@ronnybadilla.com",
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@ronnybadilla.com",
      contactType: "customer support",
      availableLanguage: ["en", "es"],
    },
    sameAs: ["https://github.com/rbadillap/registry.directory"],
  }
}

/**
 * The home page as an enumerable catalogue of registries. This is the node
 * that tells a crawler the directory has N distinct entries rather than one
 * marketing page, and it gives each registry an anchor from the root.
 */
export function buildDirectoryListSchema(
  registries: ReadonlyArray<{ name: string; description?: string; path: string }>
): JsonLdNode {
  return {
    "@context": SCHEMA,
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/#directory`,
    name: `${SITE_NAME} — shadcn/ui registry directory`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      name: "shadcn/ui registries",
      numberOfItems: registries.length,
      itemListElement: registries.map((registry, index) =>
        compact({
          "@type": "ListItem",
          position: index + 1,
          name: registry.name,
          description: registry.description,
          url: absoluteUrl(registry.path),
        })
      ),
    },
  }
}

/**
 * Breadcrumbs for a nested route. Pass the trail without the site root — it is
 * prepended here so every page agrees on position 1.
 */
export function buildBreadcrumbSchema(
  trail: ReadonlyArray<{ name: string; path: string }>
): JsonLdNode {
  const crumbs = [{ name: "Registries", path: "/" }, ...trail]

  return {
    "@context": SCHEMA,
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

/**
 * A registry landing: the collection itself, plus an ItemList naming the
 * components it ships. The list is capped because a landing with thousands of
 * items would otherwise emit a payload larger than the page it describes.
 */
export function buildRegistryCollectionSchema({
  registry,
  basePath,
  itemNames,
  totalItems,
}: {
  registry: DirectoryEntry
  basePath: string
  itemNames: ReadonlyArray<string>
  totalItems: number
}): JsonLdNode {
  const canonical = absoluteUrl(basePath)
  const listed = itemNames.slice(0, 100)

  return compact({
    "@context": SCHEMA,
    "@type": "CollectionPage",
    "@id": `${canonical}#collection`,
    name: `${registry.name} — ${shadcnQualifier(registry.name)}registry`,
    description:
      registry.description ||
      `Browse ${totalItems} shadcn/ui components from ${registry.name}.`,
    url: canonical,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: compact({
      "@type": "SoftwareSourceCode",
      name: registry.name,
      description: registry.description,
      codeRepository: registry.github_url,
      url: registry.url,
      programmingLanguage: "TypeScript",
      runtimePlatform: "React",
    }),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalItems,
      itemListElement: listed.map((name, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
        url: absoluteUrl(`${basePath}/${name}`),
      })),
    },
  })
}

/**
 * An individual component. SoftwareSourceCode is the honest type here: the
 * page's payload is installable source, and `isPartOf` ties it back to the
 * registry collection so the two nodes form a graph rather than two islands.
 */
export function buildRegistryItemSchema({
  registry,
  basePath,
  slug,
  description,
  categoryLabel,
  dependencies,
}: {
  registry: DirectoryEntry
  basePath: string
  slug: string
  description?: string
  categoryLabel: string
  dependencies?: ReadonlyArray<string>
}): JsonLdNode {
  const canonical = absoluteUrl(`${basePath}/${slug}`)

  return compact({
    "@context": SCHEMA,
    "@type": "SoftwareSourceCode",
    "@id": `${canonical}#component`,
    name: slug,
    description:
      description ||
      `${slug}: a shadcn/ui ${categoryLabel.toLowerCase()} from ${registry.name}.`,
    url: canonical,
    codeRepository: registry.github_url,
    programmingLanguage: "TypeScript",
    runtimePlatform: "React",
    applicationCategory: "DeveloperApplication",
    isPartOf: compact({
      "@type": "CollectionPage",
      name: registry.name,
      url: absoluteUrl(basePath),
    }),
    author: compact({
      "@type": "Organization",
      name: registry.name,
      url: registry.url,
    }),
    softwareRequirement: dependencies?.slice(0, 25),
  })
}
