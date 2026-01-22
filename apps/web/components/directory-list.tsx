'use client';

import Link from "next/link";
import { ExternalLink as ExternalLinkIcon, Package, Plus, Eye } from "lucide-react";
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
import { getHostname, createSlug } from "@/lib/utils";
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
          <Card className="bg-black border border-stone-700/50 border-dashed rounded-none overflow-hidden shadow-none hover:shadow-lg hover:border-rose-700/50 transition-all h-full flex flex-col">
            <CardHeader className="flex flex-col items-center justify-center gap-3 bg-black pt-6 min-h-[140px]">
              <div className="flex-shrink-0">
                <Plus className="w-8 h-8 text-neutral-500 group-hover:text-rose-700 transition-colors" />
              </div>
              <CardTitle className="text-base text-white text-center group-hover:text-rose-700 transition-colors">
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
          <Card className="bg-black border border-stone-700/50 rounded-none overflow-hidden shadow-none hover:shadow-lg transition-shadow h-full flex flex-col">
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
                      <AvatarFallback className="bg-stone-800 text-neutral-400 text-xs">
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
                  <a
                    href={addUtmReference(entry.url)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${entry.name}`}
                    className="block group"
                  >
                    <CardTitle className="text-base text-white truncate group-hover:underline">
                      {entry.name}
                    </CardTitle>
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {showViewButton && (
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 focus-visible:ring-offset-black p-1"
                  >
                    <Link href={`/view/${createSlug(entry.name)}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
                {entry.github_url && (
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 focus-visible:ring-offset-black p-1"
                    tabIndex={0}
                  >
                    <a
                      href={entry.github_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${entry.name} on GitHub`}
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                      >
                        <path d="M22,12.247a10,10,0,0,1-6.833,9.488c-.507.1-.687-.214-.687-.481,0-.328.012-1.407.012-2.743a2.386,2.386,0,0,0-.679-1.852c2.228-.248,4.566-1.093,4.566-4.935a3.859,3.859,0,0,0-1.028-2.683,3.591,3.591,0,0,0-.1-2.647s-.838-.269-2.747,1.025a9.495,9.495,0,0,0-5.007,0c-1.91-1.294-2.75-1.025-2.75-1.025a3.6,3.6,0,0,0-.1,2.647A3.864,3.864,0,0,0,5.62,11.724c0,3.832,2.334,4.69,4.555,4.942A2.137,2.137,0,0,0,9.54,18a2.128,2.128,0,0,1-2.91-.831A2.1,2.1,0,0,0,5.1,16.142s-.977-.013-.069.608A2.646,2.646,0,0,1,6.14,18.213s.586,1.944,3.368,1.34c.005.835.014,1.463.014,1.7,0,.265-.183.574-.683.482A10,10,0,1,1,22,12.247Z"/>
                      </svg>
                    </a>
                  </Button>
                )}
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className="text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 focus-visible:ring-offset-black p-1"
                  tabIndex={0}
                >
                  <a
                    href={addUtmReference(entry.url)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${entry.name}`}
                  >
                    <ExternalLinkIcon className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-6 pt-0 bg-black flex-1 flex flex-col justify-between">
              <CardDescription className="text-sm text-neutral-300 min-h-[40px]">
                {entry.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="px-4 pb-6 pt-0 bg-black">
              <a 
                href={addUtmReference(entry.url)} 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-neutral-300 leading-relaxed font-mono truncate hover:underline"
              >
                {getHostname(entry.url)}
              </a>
            </CardFooter>
          </Card>
        </div>
      ))}
    </div>
  );
} 