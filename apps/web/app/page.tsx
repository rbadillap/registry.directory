import { Suspense } from "react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Metadata } from "next";
import { DirectoryTabs } from "@/components/directory-tabs";
import { DirectoryTabsSkeleton } from "@/components/directory-tabs-skeleton";
import { fetchAllRegistryStats } from "@/lib/registry-stats";
import { fetchAllGitHubStats } from "@/lib/github-stats";
import { fetchAllRegistryItems } from "@/lib/registry-items";
import { getAffiliates } from "@/lib/affiliates";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import type { DirectoryEntry } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroTitle } from "@/components/hero-title";

// Enable static generation
export const dynamic = 'force-static'

export const metadata: Metadata = {
  metadataBase: new URL("https://registry.directory"),
  title: "registry.directory - The explorer for shadcn/ui registries",
  description:
    "Browse, preview, and install from any shadcn/ui registry. Explore components in an IDE viewer, then copy the install command.",
  alternates: {
    canonical: "https://registry.directory",
  },
  openGraph: {
    title: "registry.directory - The explorer for shadcn/ui registries",
    description: "Browse, preview, and install from any shadcn/ui registry. Explore components in an IDE viewer, then copy the install command.",
    url: "https://registry.directory",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "registry.directory - The explorer for shadcn/ui registries",
    description: "Browse, preview, and install from any shadcn/ui registry. Explore components in an IDE viewer, then copy the install command.",
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
    }));
  } catch (error) {
    console.error("Error reading directory.json:", error);
    return [];
  }
}

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
  const tools = await getTools();
  const [stats, githubStats, items, affiliates] = await Promise.all([
    fetchAllRegistryStats(components),
    fetchAllGitHubStats(components),
    fetchAllRegistryItems(components),
    getAffiliates(),
  ]);
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start pt-24 md:pt-32 pb-12 md:pb-20">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex items-center gap-2 mb-8 md:mb-10">
        <HeroTitle />
      </div>

      <p className="text-sm mb-12 md:mb-14 px-4 text-center font-mono text-muted-foreground">
        The explorer for{" "}
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
        <span className="ml-1 font-mono font-bold">shadcn/ui</span>
        <span className="text-muted-foreground"> registries.</span>
      </p>

      <Suspense fallback={<DirectoryTabsSkeleton />}>
        <DirectoryTabs components={components} tools={tools} stats={stats} githubStats={githubStats} items={items} affiliates={affiliates} />
      </Suspense>

      <AffiliateDisclosure />
    </main>
  );
}
