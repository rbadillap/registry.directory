import { Metadata } from "next";
import { DirectoryList, DirectoryEntry } from "@/components/directory-list";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Enable static generation
export const dynamic = 'force-static'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL || "http://localhost:3000"),
  title: "registry.directory - a collection of shadcn/ui registries",
  description:
    "The place where shadcn/ui registries live. Discover, Preview, Copy, and Paste components.",
  openGraph: {
    images: [
      {
        url: "/og",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "/og",
      },
    ],
  },
};

async function getRegistries(): Promise<DirectoryEntry[]> {
  try {
    const filePath = join(process.cwd(), "public/registries.json");
    const fileContents = await readFile(filePath, "utf8");
    const registries = JSON.parse(fileContents);
    
    // Transform to DirectoryEntry format
    return registries.map((registry: DirectoryEntry) => ({
      name: registry.name,
      description: registry.description,
      url: registry.url,
    }));
  } catch (error) {
    console.error("Error reading registries.json:", error);
    // Fallback to empty array or default registries
    return [];
  }
}

export default async function Home() {
  const entries = await getRegistries();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-20">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-medium font-mono">
          registry<span className="text-muted-foreground">.directory</span>{" "}
          <span className="text-xs text-foreground rounded-md border bg-rose-700 px-1">
            beta
          </span>
        </h1>
      </div>

      <div className="text-sm mt-10 px-4 text-center font-mono">
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

      <DirectoryList entries={entries} />
    </main>
  );
}
