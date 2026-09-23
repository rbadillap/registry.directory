import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Metadata } from "next";
import Image from "next/image";
import { DirectoryList } from "@/components/directory-list";
import { FeaturedSection } from "@/components/featured-section";
import type { DirectoryEntry } from "@/lib/types";

// Enable static generation
export const dynamic = 'force-static'

export const metadata: Metadata = {
  // metadataBase: new URL(process.env.VERCEL_URL || "http://localhost:3000"),
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
    
    // Return all fields from the JSON, not just the basic ones
    return registries;
  } catch (error) {
    console.error("Error reading registries.json:", error);
    // Fallback to empty array or default registries
    return [];
  }
}

export default async function Home() {
  const entries = await getRegistries();
  const featuredEntries = entries.filter(entry => entry.featured);
  const regularEntries = entries.filter(entry => !entry.featured);

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-neutral-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(244,63,94,0.05)_50%,transparent_75%)] bg-[length:20px_20px]"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          {/* Brand */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 font-mono">
              <span className="text-white">registry.</span>
              <span className="text-rose-700">directory</span>
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-300 mb-6 max-w-2xl leading-relaxed">
            The ultimate collection of <span className="bg-linear-to-r from-foreground to-slate-300 bg-clip-text font-mono text-transparent">shadcn/ui</span> registries.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Discover, preview, and integrate beautiful components.
          </p>
        </div>
      </section>

      {/* Featured Section */}
      {featuredEntries.length > 0 && (
        <FeaturedSection featuredEntries={featuredEntries} />
      )}

      {/* All Registries Section */}
      <section className="py-20 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4">
          <DirectoryList entries={regularEntries} />
        </div>
      </section>
    </main>
  );
}
