'use client';

import Link from "next/link";
import { ExternalLink as ExternalLinkIcon, Package, Plus, Star } from "lucide-react";
import { GitHubIcon } from "@/components/icons/github";
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
import type { DirectoryEntry, GitHubStats, RegistryStats } from "@/lib/types";
import { addUtmParams } from "@/lib/utm-utils";
import { formatStars, formatRelativeTime } from "@/lib/format-utils";

interface DirectoryListProps {
  entries: DirectoryEntry[];
  searchTerm?: string;
  addCardUrl?: string;
  addCardLabel?: string;
  showViewButton?: boolean;
  stats?: Record<string, RegistryStats>;
  githubStats?: Record<string, Omit<GitHubStats, "fetchedAt">>;
}

export function DirectoryList({ entries, searchTerm = '', addCardUrl, addCardLabel, showViewButton = false, stats, githubStats }: DirectoryListProps) {
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
    <div className="w-full max-w-7xl mx-auto mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 px-2">
      {showAddCard && (
        <a
          href={addCardUrl}
          target="_blank"
          rel="noreferrer"
          className="h-full group"
        >
          <Card className="bg-black border border-neutral-700/50 border-dashed rounded-none overflow-hidden shadow-none hover:shadow-lg hover:border-neutral-700 transition-all h-full flex flex-col">
            <CardHeader className="flex flex-col items-center justify-center gap-2 bg-black pt-4 pb-3 min-h-[100px]">
              <div className="flex-shrink-0">
                <Plus className="w-7 h-7 text-neutral-500 group-hover:text-neutral-400 transition-colors" />
              </div>
              <CardTitle className="text-sm text-white text-center group-hover:text-white transition-colors">
                {addCardLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4 pt-0 bg-black flex-1 flex flex-col justify-between">
              <CardDescription className="text-xs text-neutral-400 text-center">
                Share your registry with the community
              </CardDescription>
            </CardContent>
          </Card>
        </a>
      )}

      {entries.map((entry) => {
        const gh = entry.github_url ? githubStats?.[entry.github_url] : undefined;
        const s = stats?.[entry.url];

        // Build viewer route for Components tab
        const viewerHref = (() => {
          if (!showViewButton) return null;
          const match = entry.github_url?.match(/github\.com\/([^/]+)\/([^/]+)/);
          if (!match) return null;
          const owner = match[1];
          const repo = match[2]?.replace(/\.git$/, '');
          return `/${owner}/${repo}`;
        })();

        return (
          <div key={encodeURIComponent(entry.url)} className="h-full">
            <Card className="bg-black border border-neutral-700/50 rounded-none overflow-hidden shadow-none hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-2 bg-black pt-4 pb-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {entry.github_profile ? (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={entry.github_profile} alt="" />
                      <AvatarFallback className="bg-neutral-800 text-neutral-400 text-xs">
                        {entry.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex-shrink-0">
                      <Package className="w-5 h-5 text-neutral-500" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm text-white truncate">
                      {entry.name}
                    </CardTitle>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  {entry.github_url && (
                    <a
                      href={entry.github_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${entry.name} on GitHub`}
                      className="text-neutral-600 hover:text-neutral-400 transition-colors"
                    >
                      <GitHubIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <a
                    href={addUtmParams(entry.url, "registry_preview")}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Visit ${entry.name} website`}
                    className="text-neutral-600 hover:text-neutral-400 transition-colors"
                  >
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 bg-black flex-1 flex flex-col justify-between">
                <CardDescription className="text-[13px] text-neutral-300 line-clamp-2">
                  {entry.description}
                </CardDescription>
                {(gh || s) && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                      {gh && (
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                          {formatStars(gh.stars)}
                        </span>
                      )}
                      {gh && s && (
                        <span className="text-neutral-600" aria-hidden="true">·</span>
                      )}
                      {s && (
                        <span className="tabular-nums">
                          {s.totalItems} {s.totalItems === 1 ? "item" : "items"}
                        </span>
                      )}
                    </div>
                    {gh && (
                      <p className="text-[11px] font-mono text-neutral-500">
                        updated {formatRelativeTime(gh.lastCommit)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
              {viewerHref && (
                <CardFooter className="px-3 pt-0 pb-3 bg-black">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full border-neutral-700 hover:bg-neutral-900 hover:text-white h-8 text-xs"
                  >
                    <Link href={viewerHref}>
                      Explore
                    </Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
