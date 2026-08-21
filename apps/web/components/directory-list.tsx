'use client';

import { useState } from "react";
import Link from "next/link";
import { ExternalLink as ExternalLinkIcon, Package, Star } from "lucide-react";
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
import type { DirectoryEntry, GitHubStats, RegistryStats, AffiliateConfig } from "@/lib/types";
import type { IndexedItem } from "@/lib/items-index";
import type { ItemIndexStatus } from "@/hooks/use-item-index";
import { addUtmParams } from "@/lib/utm-utils";
import { useAnalytics } from "@/hooks/use-analytics";
import { formatStars, formatRelativeTime } from "@/lib/format-utils";
import { REGISTRY_TYPE_LABELS, REGISTRY_TYPE_ICONS } from "@/lib/registry-mappings";
import { SubmitRegistryCard } from "@/components/submit-registry-dialog";

interface ResultClickData {
  result_type: "registry" | "item";
  result_name: string;
  result_position: number;
}

interface DirectoryListProps {
  entries: DirectoryEntry[];
  searchTerm?: string;
  addCardLabel?: string;
  showViewButton?: boolean;
  stats?: Record<string, RegistryStats>;
  githubStats?: Record<string, Omit<GitHubStats, "fetchedAt">>;
  affiliates?: Record<string, AffiliateConfig>;
  itemResults?: IndexedItem[];
  /** Whether the item index behind itemResults has arrived yet. */
  itemsStatus?: ItemIndexStatus;
  onResultClick?: (data: ResultClickData) => void;
  premiumFilterActive?: boolean;
}

export function DirectoryList({ entries, searchTerm = '', addCardLabel, showViewButton = false, stats, githubStats, affiliates, itemResults = [], itemsStatus = 'ready', onResultClick, premiumFilterActive = false }: DirectoryListProps) {
  const { trackHomeRegistryVisit } = useAnalytics();
  const showAddCard = !searchTerm && addCardLabel;
  const hasItems = itemResults.length > 0;
  const hasRegistries = entries.length > 0;

  if (!hasRegistries && !hasItems && !showAddCard) {
    // Components are searched against an index that arrives separately.
    // Until it does, "nothing matches" is not something we know.
    const message = searchTerm
      ? itemsStatus === 'loading'
        ? 'Searching components…'
        : itemsStatus === 'error'
          ? 'Components could not be searched right now. Registries above still match.'
          : `No entries found matching "${searchTerm}"`
      : 'No entries available';

    return (
      <div className="w-full max-w-5xl mx-auto mt-12 px-4 text-center">
        <p className="text-muted-foreground text-sm font-mono">{message}</p>
      </div>
    );
  }

  return (
    <>
    {/* Registry cards — only shown when there are registry-level matches */}
    {hasRegistries && (
    <div className="w-full max-w-7xl mx-auto mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 px-2">
      {showAddCard && <SubmitRegistryCard label={addCardLabel} />}

      {entries.map((entry, index) => {
        const gh = entry.github_url ? githubStats?.[entry.github_url] : undefined;
        const s = stats?.[entry.url];
        const affiliate = affiliates?.[entry.url];

        // Build viewer route for Components tab: github pair first, then the
        // /{handle} shortlink for namespaced entries without a repo
        const viewerHref = (() => {
          if (!showViewButton) return null;
          const match = entry.github_url?.match(/github\.com\/([^/]+)\/([^/]+)/);
          if (match) {
            const owner = match[1];
            const repo = match[2]?.replace(/\.git$/, '');
            return `/${owner}/${repo}`;
          }
          if (entry.namespace) {
            return `/${entry.namespace.replace(/^@/, '')}`;
          }
          return null;
        })();

        // Standard card (same layout for all, with optional sponsored ribbon for affiliates)
        return (
          <div key={encodeURIComponent(entry.url)} className="h-full">
            <Card className="bg-background border border-border-subtle rounded-none overflow-hidden shadow-none hover:shadow-lg transition-shadow h-full flex flex-col relative">
              {affiliate && (
                <span className="absolute top-0 right-0 type-label text-muted-foreground bg-secondary border-b border-l border-border-subtle px-1.5 py-0.5 z-10">
                  Sponsored
                </span>
              )}
              <CardHeader className="flex flex-row items-start justify-between gap-2 bg-background pt-4 pb-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {entry.github_profile ? (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={entry.github_profile} alt="" />
                      <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                        {entry.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex-shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="type-card text-foreground truncate">
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
                      className="text-foreground-subtle hover:text-muted-foreground transition-colors"
                    >
                      <GitHubIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <a
                    href={affiliate ? affiliate.affiliate_url : addUtmParams(entry.url, "registry_preview")}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${entry.name} website`}
                    className="text-foreground-subtle hover:text-muted-foreground transition-colors"
                    onClick={() => trackHomeRegistryVisit({
                      registry: entry.name,
                      sponsored: Boolean(affiliate),
                      premium_filter_active: premiumFilterActive,
                    })}
                  >
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 bg-background flex-1 flex flex-col justify-between">
                <CardDescription className="text-[13px] text-foreground-secondary line-clamp-2 text-pretty">
                  {entry.description}
                </CardDescription>
                {(gh || s) && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1.5 type-meta text-muted-foreground">
                      {gh && (
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                          {formatStars(gh.stars)}
                        </span>
                      )}
                      {gh && s && (
                        <span className="text-foreground-subtle" aria-hidden="true">·</span>
                      )}
                      {s && (
                        <span className="tabular-nums">
                          {s.totalItems} {s.totalItems === 1 ? "item" : "items"}
                        </span>
                      )}
                    </div>
                    {gh && (
                      <p className="type-meta text-muted-foreground">
                        updated {formatRelativeTime(gh.lastCommit)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
              {viewerHref && (
                <CardFooter className="px-3 pt-0 pb-3 bg-background">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full border-border hover:bg-accent hover:text-foreground h-8 text-xs"
                  >
                    <Link
                      href={viewerHref}
                      onClick={() => searchTerm && onResultClick?.({ result_type: "registry", result_name: entry.name, result_position: index })}
                    >
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
    )}

    {/* Item results — flat list, each card shows registry as metadata */}
    {hasItems && (
      <ItemResults key={searchTerm} items={itemResults} onResultClick={onResultClick} />
    )}

    </>
  );
}

const INITIAL_ITEMS_LIMIT = 12;

function ItemResults({ items, onResultClick }: { items: IndexedItem[]; onResultClick?: (data: ResultClickData) => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > INITIAL_ITEMS_LIMIT;
  const visibleItems = expanded ? items : items.slice(0, INITIAL_ITEMS_LIMIT);

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 px-2">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-mono text-muted-foreground">
          Components found
        </h3>
        <span className="text-xs font-mono text-foreground-subtle">
          {items.length} {items.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {visibleItems.map((item, index) => {
            const registryKey = item.registry.basePath;
            const itemTypeSlug = item.type.replace('registry:', '');
            const typeLabel = REGISTRY_TYPE_LABELS[itemTypeSlug] || itemTypeSlug;
            const TypeIcon = REGISTRY_TYPE_ICONS[itemTypeSlug] || Package;

            return (
              <Link
                key={`${registryKey}/${item.name}`}
                href={`${item.registry.basePath}/${item.name}`}
                onClick={() => onResultClick?.({ result_type: "item", result_name: item.name, result_position: index })}
                // Expanding a broad search can put thousands of these on the
                // page. The browser skips layout and paint for the ones below
                // the fold; the intrinsic size keeps the scrollbar honest, and
                // auto lets it remember the real height once measured.
                className="result-card-deferred"
              >
                <Card className="bg-background border border-border-subtle rounded-none overflow-hidden shadow-none hover:shadow-lg hover:border-border transition-all h-full flex flex-col">
                  <CardHeader className="bg-background pt-3 pb-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar className="w-4 h-4 flex-shrink-0">
                          {item.registry.avatarUrl && (
                            <AvatarImage src={item.registry.avatarUrl} alt="" />
                          )}
                          <AvatarFallback className="bg-secondary text-muted-foreground text-[10px]">
                            {item.registry.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="type-meta text-muted-foreground truncate">
                          {item.registry.name}
                        </span>
                      </div>
                      <span className="flex-shrink-0" role="img" aria-label={typeLabel} title={typeLabel}>
                        <TypeIcon className="w-3.5 h-3.5 text-foreground-subtle" aria-hidden="true" />
                      </span>
                    </div>
                    <CardTitle className="type-card text-foreground truncate">
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 pt-0 bg-background flex-1">
                    {item.description && (
                      <CardDescription className="text-[13px] text-foreground-secondary line-clamp-2 text-pretty">
                        {item.description}
                      </CardDescription>
                    )}
                    {item.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.categories.map(cat => (
                          <span key={cat} className="type-meta text-muted-foreground bg-secondary px-1.5 py-0.5">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* The control follows the results and never covers them: nothing
            that announces more should dim what is already being read. */}
        {hasMore && !expanded && (
          <div className="flex justify-center pt-6">
            <button
              onClick={() => setExpanded(true)}
              className="text-xs font-mono text-muted-foreground border border-border px-4 py-2 hover:border-ring hover:text-foreground transition-colors"
            >
              Show {items.length - INITIAL_ITEMS_LIMIT} more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
