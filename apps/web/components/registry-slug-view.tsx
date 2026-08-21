import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { RegistryViewer } from "@/components/registry-viewer"
import type { DirectoryEntry } from "@/lib/types"
import type { RegistryItem, RegistryListing, RegistryListingItem } from "@/lib/registry-types"
import {
  slugToType,
  typeToSlug,
  groupItemsByCategory,
  isCategory,
  REGISTRY_TYPE_LABELS,
  singularType,
} from "@/lib/registry-mappings"
import { getAffiliates } from "@/lib/affiliates"
import { loadRegistryIndex, parseGithubRef } from "@/lib/resolve-registry"
import { loadRegistryView } from "@/lib/registry-data"
import { JsonLd } from "@/components/json-ld"
import {
  buildBreadcrumbSchema,
  buildRegistryItemSchema,
} from "@/lib/structured-data"


// The preview image lives at a route handler rather than beside the page: the
// item route is a catch-all, so nothing can sit under it, and the URL has to be
// emitted rather than inferred from a file's position.
//
// Only github-backed registries have one, because the handler resolves its
// subject the same way the page does.
function previewImage(registry: DirectoryEntry, slug: string): string | null {
  const github = parseGithubRef(registry.github_url)
  if (!github) return null
  return `https://registry.directory/api/og/item/${github.owner}/${github.repo}/${slug}`
}

// The handler renders a card for a category and for an item alike, so both
// branches of the metadata below advertise one.
// Open Graph wants the dimensions, Twitter wants the bare URL. One lookup,
// two shapes, so the two can never disagree about whether an image exists.
function socialImages(registry: DirectoryEntry, slug: string, alt: string) {
  const url = previewImage(registry, slug)
  if (!url) return { openGraph: {}, twitter: {} }
  return {
    openGraph: { images: [{ url, width: 1200, height: 630, alt }] },
    twitter: { images: [url] },
  }
}

// What a category listing renders from each of its items: a row, a link, and
// the words its filter searches. The rest of the record — dependencies, style
// variables, every file past the first — is never read there, and a category
// can hold thousands of items.
function forListing(item: RegistryItem): RegistryListingItem {
  // Named one by one, on purpose. Removing the fields a listing does not read
  // would leak every field added to RegistryItem later; naming the ones it
  // does read means a new field has to be asked for before it can travel.
  const first = item.files?.[0]
  return {
    name: item.name,
    type: item.type,
    ...(item.title ? { title: item.title } : {}),
    ...(item.description ? { description: item.description } : {}),
    // Only the first file, and only where it installs: that is what a row
    // shows and what the grouping logic reads. Its contents are the whole
    // reason a category is heavy, and a row never displays them.
    ...(first
      ? { files: [{ path: first.path, type: first.type, target: first.target }] }
      : {}),
  }
}

// Metadata for a category-or-item view living at `${basePath}/${slug}`.
export async function buildSlugMetadata(
  registry: DirectoryEntry,
  basePath: string,
  slug: string
): Promise<Metadata> {
  const canonical = `https://registry.directory${basePath}/${slug}`

  if (isCategory(slug)) {
    const categoryLabel = REGISTRY_TYPE_LABELS[slug] || slug
    const title = `shadcn ${categoryLabel.toLowerCase()} — ${registry.name}`
    const description = `Browse shadcn/ui ${categoryLabel.toLowerCase()} from ${registry.name}. Preview the source and install with the shadcn CLI.`
    const social = socialImages(registry, slug, title)
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        type: "website",
        ...social.openGraph,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...social.twitter,
      },
    }
  }

  // Item view - use registry index instead of individual fetch to avoid timeout during build
  const registryIndex = await loadRegistryIndex(registry)
  const itemData = registryIndex?.items?.find((item) => item.name === slug)
  const categorySlug = itemData ? typeToSlug(itemData.type) : null
  const categoryLabel = categorySlug
    ? REGISTRY_TYPE_LABELS[categorySlug] || categorySlug
    : "Component"

  // An item slug on its own ("dashboard-01") matches no query. Pairing it with
  // the shadcn qualifier and the registry name is what makes the long tail
  // reachable — these are the bulk of our indexable URLs.
  const noun = singularType(categoryLabel)
  const title = `${slug} — shadcn ${noun} · ${registry.name}`
  const description = `${itemData?.description || slug}: a shadcn/ui ${noun} from ${registry.name}. Preview the source and install it with the shadcn CLI.`

  const social = socialImages(registry, slug, title)
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      ...social.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...social.twitter,
    },
  }
}

// Category-or-item viewer for any entry, at `${basePath}/${slug}`.
// Calls notFound() internally when the slug doesn't resolve.
export async function RegistrySlugView({
  registry,
  basePath,
  slug,
}: {
  registry: DirectoryEntry
  basePath: string
  slug: string
}) {
  const view = await loadRegistryView(registry)
  if (!view) {
    notFound()
  }

  const [categoriesMap, affiliates] = await Promise.all([
    Promise.resolve(groupItemsByCategory(view.items)),
    getAffiliates(),
  ])
  const affiliate = affiliates[registry.url] ?? null

  // Category view: show list of items in category
  if (isCategory(slug)) {
    const registryType = slugToType(slug)
    if (!registryType) {
      notFound()
    }

    const categoryItems = categoriesMap.get(slug)
    if (!categoryItems || categoryItems.length === 0) {
      notFound()
    }

    const filteredRegistry: RegistryListing = {
      name: view.name,
      homepage: view.homepage,
      items: categoryItems.map(forListing),
    }

    const categoryLabel = REGISTRY_TYPE_LABELS[slug] || slug

    return (
      <>
        <JsonLd
          data={buildBreadcrumbSchema([
            { name: registry.name, path: basePath },
            { name: categoryLabel, path: `${basePath}/${slug}` },
          ])}
        />
        <RegistryViewer
          registry={registry}
          registryIndex={filteredRegistry}
          handle={view.key}
          categorySize={categoryItems.length}
          selectedItem={null}
          currentCategory={slug}
          affiliate={affiliate}
          basePath={basePath}
        />
      </>
    )
  }

  // Item view. The item comes from the committed view, not from its origin:
  // everything rendered on the server — name, description, type, dependencies,
  // file paths — is metadata, and metadata is what data/ holds. The file
  // contents arrive later, from /r, once a reader opens a file.
  //
  // Fetching here instead would put a third-party request in the render path,
  // and a page that cannot be rendered without the network cannot be
  // prerendered.
  const itemData = view.items.find((item) => item.name === slug)
  if (!itemData) {
    notFound()
  }

  const currentCategory = typeToSlug(itemData.type)
  if (!currentCategory) {
    notFound()
  }

  const categoryItems = categoriesMap.get(currentCategory) || []

  // Reading one component does not need its siblings. The viewer shows the
  // item's own files and, at the bottom, how many items the category holds —
  // so the count travels and the list does not. A category can run to
  // thousands of items, and every one of its item pages was carrying all of
  // them to render one.
  const filteredRegistry: RegistryListing = {
    name: view.name,
    homepage: view.homepage,
    items: [],
  }

  const categoryLabel = REGISTRY_TYPE_LABELS[currentCategory] || currentCategory

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: registry.name, path: basePath },
            { name: categoryLabel, path: `${basePath}/${currentCategory}` },
            { name: slug, path: `${basePath}/${slug}` },
          ]),
          buildRegistryItemSchema({
            registry,
            basePath,
            slug,
            description: itemData.description,
            categoryLabel,
            dependencies: itemData.dependencies,
          }),
        ]}
      />
      <RegistryViewer
        registry={registry}
        registryIndex={filteredRegistry}
        handle={view.key}
        categorySize={categoryItems.length}
        selectedItem={itemData}
        currentCategory={currentCategory}
        affiliate={affiliate}
        basePath={basePath}
      />
    </>
  )
}
