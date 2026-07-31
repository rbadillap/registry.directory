import { ViewerHeader } from "@/components/viewer/viewer-header"
import { addUtmParams } from "@/lib/utm-utils"
import { getInstallCommand } from "@/lib/install-command"
import { sortByTypeRelevance } from "@/lib/registry-mappings"
import type { RegistryItem } from "@/lib/registry-types"
import type { AffiliateConfig, DirectoryEntry } from "@/lib/types"
import type { SemanticCategory } from "@/app/(app)/[owner]/[repo]/page"
import { LandingHero } from "./landing-hero"
import { InstallCard } from "./install-card"
import { ProCard } from "./pro-card"
import { FeaturedGrid } from "./featured-grid"
import { BrowseByType } from "./browse-by-type"
import { TagsSection } from "./tags-section"

interface RegistryLandingProps {
  registry: DirectoryEntry
  owner: string
  repo: string
  // null = degraded mode: the registry exposes no usable aggregate index
  categories: Map<string, RegistryItem[]> | null
  featuredItems: RegistryItem[]
  totalItems: number
  githubStats?: { stars: number; lastCommit: string } | null
  semanticCategories?: SemanticCategory[]
  affiliate?: AffiliateConfig | null
}

export function RegistryLanding({
  registry,
  owner,
  repo,
  categories,
  featuredItems,
  totalItems,
  githubStats,
  semanticCategories = [],
  affiliate,
}: RegistryLandingProps) {
  const degraded = !categories || categories.size === 0
  const visitHref = affiliate
    ? affiliate.affiliate_url
    : addUtmParams(registry.url, "registry_overview")

  let installItemName: string | null = null
  if (featuredItems.length > 0) {
    installItemName = featuredItems[0]!.name
  } else if (!degraded) {
    const firstSlug = sortByTypeRelevance(Array.from(categories!.keys()))[0]
    installItemName = firstSlug
      ? (categories!.get(firstSlug)?.[0]?.name ?? null)
      : null
  }
  const installCommand = installItemName
    ? `npx shadcn@latest add ${getInstallCommand({ registry, itemName: installItemName, owner, repo })}`
    : null

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ViewerHeader registry={registry} affiliate={affiliate} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1080px] space-y-10 px-4 py-8 md:px-6 md:py-12">
          <section className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start lg:gap-16">
            <LandingHero
              registry={registry}
              owner={owner}
              repo={repo}
              typesCount={categories?.size ?? 0}
              totalItems={totalItems}
              githubStats={githubStats}
              visitHref={visitHref}
            />
            {(installCommand || registry.pro) && (
              <div className="flex w-full max-w-[440px] flex-col gap-4">
                {installCommand && (
                  <InstallCard command={installCommand} totalItems={totalItems} />
                )}
                {registry.pro && <ProCard pro={registry.pro} />}
              </div>
            )}
          </section>

          {featuredItems.length > 0 && (
            <FeaturedGrid
              items={featuredItems.slice(0, 6)}
              owner={owner}
              repo={repo}
            />
          )}

          {!degraded && (
            <BrowseByType categories={categories!} owner={owner} repo={repo} />
          )}

          {!degraded && <TagsSection tags={semanticCategories} />}
        </div>
      </main>
    </div>
  )
}
