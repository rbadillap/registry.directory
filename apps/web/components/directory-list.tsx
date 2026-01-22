'use client';

import Link from "next/link";
import { ExternalLink as ExternalLinkIcon, Package, Plus, Code2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@workspace/ui/components/card";
import {
  Button,
} from "@workspace/ui/components/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { createSlug } from "@/lib/utils";
import type { DirectoryEntry } from "@/lib/types";

const addUtmReference = (url: string) => {
  try {
    const u = new URL(url)
    u.searchParams.set("utm_source", "registry.directory")
    u.searchParams.set("utm_medium", "directory")
    u.searchParams.set("utm_campaign", "registry_preview")
    return u.toString()
  } catch {
    // Fallback if URL is invalid
    return url
  }
}

interface DirectoryListProps {
  entries: DirectoryEntry[];
  searchTerm?: string;
  addCardUrl?: string;
  addCardLabel?: string;
  showViewButton?: boolean;
}

export function DirectoryList({ entries, searchTerm = '', addCardUrl, addCardLabel, showViewButton = false }: DirectoryListProps) {
  const showAddCard = !searchTerm && addCardUrl && addCardLabel;

  if (entries.length === 0 && !showAddCard) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-12 px-4 text-center">
        <p className="text-neutral-400 text-sm font-mono">
          {searchTerm
            ? `No entries found matching "${searchTerm}"`
            : "No entries available"}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
      {showAddCard && (
        <a
          href={addCardUrl}
          target="_blank"
          rel="noreferrer"
          className="h-full group"
        >
          <Card className="bg-black border border-neutral-700/50 border-dashed rounded-none overflow-hidden shadow-none hover:shadow-lg hover:border-neutral-700 transition-all h-full flex flex-col">
            <CardHeader className="flex flex-col items-center justify-center gap-3 bg-black pt-6 min-h-[140px]">
              <div className="flex-shrink-0">
                <Plus className="w-8 h-8 text-neutral-500 group-hover:text-neutral-400 transition-colors" />
              </div>
              <CardTitle className="text-base text-white text-center group-hover:text-white transition-colors">
                {addCardLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 pt-0 bg-black flex-1 flex flex-col justify-between">
              <CardDescription className="text-sm text-neutral-400 text-center min-h-[40px]">
                Share your registry with the community
              </CardDescription>
            </CardContent>
          </Card>
        </a>
      )}

      {entries.map((entry) => (
        <div key={encodeURIComponent(entry.url)} className="h-full">
          <Card className="bg-black border border-neutral-700/50 rounded-none overflow-hidden shadow-none hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between gap-2 bg-black pt-6">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {entry.github_profile ? (
                  <a
                    href={entry.github_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${entry.name} on GitHub`}
                    className="flex-shrink-0 mt-0.5 hover:opacity-80 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={entry.github_profile} alt={entry.name} />
                      <AvatarFallback className="bg-neutral-800 text-neutral-400 text-xs">
                        {entry.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </a>
                ) : (
                  <div className="flex-shrink-0 mt-0.5">
                    <Package className="w-5 h-5 text-neutral-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base text-white truncate">
                    {entry.name}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-6 pt-0 bg-black flex-1 flex flex-col justify-between">
              <CardDescription className="text-sm text-neutral-300 min-h-[40px]">
                {entry.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="px-4 pt-0 bg-black">
              <div className={`grid gap-2 w-full ${showViewButton ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <Button
                  asChild
                  variant="link"
                  size="sm"
                  className="border-neutral-700 hover:bg-neutral-900 hover:text-current/90"
                >
                  <a href={addUtmReference(entry.url)} target="_blank" rel="noreferrer" className="gap-1.5">
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                    Visit Site
                  </a>
                </Button>
                {showViewButton && (() => {
                  // Extract owner and repo from github_url for semantic routes
                  const match = entry.github_url?.match(/github\.com\/([^/]+)\/([^/]+)/)
                  if (!match) return null

                  const owner = match[1]
                  const repo = match[2]?.replace(/\.git$/, '')

                  return (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-neutral-700 hover:bg-neutral-900 hover:text-white"
                    >
                      <Link href={`/${owner}/${repo}`} className="gap-1.5">
                        <Code2 className="w-3.5 h-3.5" />
                        Open in IDE
                      </Link>
                    </Button>
                  )
                })()}
              </div>
            </CardFooter>
          </Card>
        </div>
      ))}
    </div>
  );
}
