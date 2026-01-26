import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Metadata } from "next";
import { DirectoryTabs } from "@/components/directory-tabs";
import type { DirectoryEntry } from "@/lib/types";

// Enable static generation
export const dynamic = 'force-static'

export const metadata: Metadata = {
  metadataBase: new URL("https://registry.directory"),
  title: "registry.directory - Explore your favorite shadcn/ui registry",
  description:
    "The home for shadcn/ui registries. Explore components in our IDE viewer, then install with one command.",
  alternates: {
    canonical: "https://registry.directory",
  },
  openGraph: {
    title: "registry.directory - Explore your favorite shadcn/ui registry",
    description: "The home for shadcn/ui registries. Explore components in our IDE viewer, then install with one command.",
    url: "https://registry.directory",
    type: "website",
    images: [
      {
        url: "/og",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "registry.directory - Explore your favorite shadcn/ui registry",
    description: "The home for shadcn/ui registries. Explore components in our IDE viewer, then install with one command.",
    images: [
      {
        url: "/og",
      },
    ],
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
    }));
  } catch (error) {
    console.error("Error reading directory.json:", error);
    // Fallback to empty array or default registries
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
  return (
    <main className="flex min-h-screen flex-col items-center justify-start pt-24 md:pt-32 pb-12 md:pb-20">
      <div className="flex items-center gap-2 mb-8 md:mb-10">
        <h1 className="text-sm font-medium font-mono">
          registry<span className="text-muted-foreground">.directory</span>{" "}
          <span className="text-xs text-foreground rounded-md border bg-rose-700 px-1">
            beta
          </span>
        </h1>
      </div>

      <div className="text-sm mb-12 md:mb-14 px-4 text-center font-mono leading-relaxed">
        <span className="text-muted-foreground">discover, preview, copy </span>
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
        <span className="text-muted-foreground"> registries</span>
      </div>

      <DirectoryTabs components={components} tools={tools} />
    </main>
  );
}
