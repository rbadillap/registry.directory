import { Suspense } from "react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Metadata } from "next";
import { DirectoryTabs } from "@/components/directory-tabs";
import { DirectoryTabsSkeleton } from "@/components/directory-tabs-skeleton";
import { fetchAllRegistryStats } from "@/lib/registry-stats";
import { fetchAllGitHubStats } from "@/lib/github-stats";
import { loadCollections, loadShipped } from "@/lib/registry-data";
import { getAffiliates } from "@/lib/affiliates";
import { SiteFooter } from "@/components/site-footer";
import type { DirectoryEntry } from "@/lib/types";
import { HomeControls } from "@/components/home-controls";
import { HeroTitle } from "@/components/hero-title";
import { JsonLd } from "@/components/json-ld";
import { buildDirectoryListSchema } from "@/lib/structured-data";
import { registryBasePath } from "@/lib/resolve-registry";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  TWITTER_HANDLE,
} from "@/lib/seo";

// Enable static generation
export const dynamic = 'force-static'

// The home title leads with the artefact nouns people actually search
// ("registries, components, blocks") rather than with "explorer", which
// describes the product but matches no query.
const HOME_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: HOME_TITLE,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
  },
};

async function getRegistries(): Promise<DirectoryEntry[]> {
  try {
    const filePath = join(process.cwd(), "public/directory.json");
    const fileContents = await readFile(filePath, "utf8");
    const data = JSON.parse(fileContents) as { registries: DirectoryEntry[] };
    const registries = data.registries;

    // Transform to DirectoryEntry format
    return registries.map((registry: DirectoryEntry) => ({
      name: registry.name,
      description: registry.description,
      url: registry.url,
      github_url: registry.github_url,
      github_profile: registry.github_profile,
      registry_url: registry.registry_url,
      namespace: registry.namespace,
      pro: registry.pro,
    }));
  } catch (error) {
    console.error("Error reading directory.json:", error);
    return [];
  }
}

// Tools are benched — they are no longer rendered on the home page, but the
// curated data is preserved in public/tools.json. This loader is intentionally
// kept so bringing Tools back is a one-line change in Home().
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getTools(): Promise<DirectoryEntry[]> {
  try {
    const filePath = join(process.cwd(), "public/tools.json");
    const fileContents = await readFile(filePath, "utf8");
    const data = JSON.parse(fileContents) as { registries: DirectoryEntry[] };
    const tools = data.registries;

    // Transform to DirectoryEntry format
    return tools.map((tool: DirectoryEntry) => ({
      name: tool.name,
      description: tool.description,
      url: tool.url,
      github_url: tool.github_url,
      github_profile: tool.github_profile,
    }));
  } catch (error) {
    console.error("Error reading tools.json:", error);
    // Fallback to empty array
    return [];
  }
}

export default async function Home() {
  const components = await getRegistries();
  // Every one of these reads apps/web/data: no registry is contacted while
  // this page renders, and rendering has no side effects.
  const [stats, githubStats, affiliates, collections, shipped] = await Promise.all([
    fetchAllRegistryStats(components),
    fetchAllGitHubStats(components),
    getAffiliates(),
    loadCollections(),
    loadShipped(),
  ]);
  const directorySchema = buildDirectoryListSchema(
    components.flatMap((registry) => {
      const path = registryBasePath(registry);
      if (!path) return [];
      return [
        { name: registry.name, description: registry.description, path },
      ];
    })
  );

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start pt-24 md:pt-32 pb-12 md:pb-20">
      <JsonLd data={directorySchema} />
      {/* Both controls belong to the page, not to the corners of the window:
          they sit at the right edge of the column everything else uses. */}
      <div className="w-full max-w-7xl mx-auto px-4 flex justify-end gap-2 -mt-16 md:-mt-20 mb-8">
        <HomeControls />
      </div>

      <div className="flex items-center gap-2 mb-8 md:mb-10">
        <HeroTitle />
      </div>

      {/* Semantically the page's value proposition — an h2 so the document
          outline states what the site is, styled identically to the old <p>. */}
      <h2 className="text-sm font-normal mb-12 md:mb-14 px-4 text-center font-mono text-muted-foreground">
        The explorer for the{" "}
        <span className="text-foreground">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="inline-flex size-4 text-muted-foreground"
          >
            <path
              d="M21.0001 12.4286L12.4287 21"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M19.2857 3L3 19.2857"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </span>
        <span className="ml-1 font-mono font-bold">shadcn</span>
        <span className="text-muted-foreground"> registry ecosystem.</span>
      </h2>

      <Suspense fallback={<DirectoryTabsSkeleton />}>
        <DirectoryTabs components={components} stats={stats} githubStats={githubStats} affiliates={affiliates} collections={collections} shipped={shipped} />
      </Suspense>

      <SiteFooter />
    </main>
  );
}
