'use client';

import { useState, useMemo, useDeferredValue, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { DirectoryList } from './directory-list';
import { SearchBar } from './search-bar';
import { useAnalytics, type SearchResultType, type HomeTab } from '@/hooks/use-analytics';
import { useUrlState } from '@/hooks/use-url-state';
import type { DirectoryEntry, GitHubStats, RegistryStats, AffiliateConfig } from '@/lib/types';
import type { IndexedItem } from '@/lib/items-index';
import { searchItems } from '@/lib/search-utils';

type SortMode = 'popular' | 'stars' | 'recently-active';

function filterBySearch(entries: DirectoryEntry[], searchTerm: string): DirectoryEntry[] {
  if (!searchTerm) return entries;
  const term = searchTerm.toLowerCase();
  return entries.filter(entry =>
    entry.name.toLowerCase().includes(term) ||
    entry.description.toLowerCase().includes(term) ||
    entry.url.toLowerCase().includes(term)
  );
}

type GitHubStatsRecord = Record<string, Omit<GitHubStats, 'fetchedAt'>>;

/**
 * Reorder registries by the active sort. The card set is identical across
 * sorts — only the order changes — so all of this is a pure client-side
 * reordering of data already in props (no fetch, no infra).
 *
 * - popular: curated order as-is (the order in directory.json)
 * - stars: GitHub stars, descending
 * - recently-active: last commit (pushed_at), descending
 *
 * Entries without GitHub data sink to the bottom; ties fall back to the
 * curated order via a stable index tiebreak.
 */
function sortRegistries(
  entries: DirectoryEntry[],
  mode: SortMode,
  githubStats: GitHubStatsRecord
): DirectoryEntry[] {
  if (mode === 'popular') return entries;

  const statOf = (entry: DirectoryEntry) =>
    entry.github_url ? githubStats[entry.github_url] : undefined;

  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      let av: number;
      let bv: number;
      if (mode === 'stars') {
        av = statOf(a.entry)?.stars ?? -1;
        bv = statOf(b.entry)?.stars ?? -1;
      } else {
        const at = statOf(a.entry)?.lastCommit;
        const bt = statOf(b.entry)?.lastCommit;
        av = at ? Date.parse(at) : -Infinity;
        bv = bt ? Date.parse(bt) : -Infinity;
      }
      if (bv !== av) return bv - av;
      return a.index - b.index; // stable: preserve curated order among ties
    })
    .map(({ entry }) => entry);
}

interface DirectoryTabsProps {
  components: DirectoryEntry[];
  stats: Record<string, RegistryStats>;
  githubStats: GitHubStatsRecord;
  items: IndexedItem[];
  affiliates: Record<string, AffiliateConfig>;
}

export function DirectoryTabs({ components, stats, githubStats, items, affiliates }: DirectoryTabsProps) {
  const analytics = useAnalytics();
  const { activeTab, setActiveTab, searchTerm, setSearchTerm } = useUrlState();
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const [premiumOnly, setPremiumOnly] = useState(false);

  const filteredComponents = useMemo(
    () => filterBySearch(premiumOnly ? components.filter(entry => entry.pro) : components, searchTerm),
    [components, searchTerm, premiumOnly]
  );

  const handlePremiumToggle = useCallback(() => {
    const enabled = !premiumOnly;
    setPremiumOnly(enabled);
    analytics.trackPremiumToggled({
      enabled,
      active_tab: activeTab as HomeTab,
      has_query: Boolean(searchTerm),
      results_count: filterBySearch(enabled ? components.filter(entry => entry.pro) : components, searchTerm).length,
    });
  }, [premiumOnly, activeTab, searchTerm, components, analytics]);

  // Sort the (filtered) registries by the active tab. Search filters, sort orders.
  const sortedComponents = useMemo(
    () => sortRegistries(filteredComponents, activeTab as SortMode, githubStats),
    [filteredComponents, activeTab, githubStats]
  );

  const filteredItems = useMemo(() => {
    if (!deferredSearchTerm) return [];
    return searchItems(items, deferredSearchTerm);
  }, [items, deferredSearchTerm]);

  // Track search performed (debounced via hook)
  useEffect(() => {
    if (!deferredSearchTerm) return;
    analytics.trackSearchPerformed({
      search_query: deferredSearchTerm,
      active_tab: activeTab as SortMode,
      registry_results_count: sortedComponents.length,
      item_results_count: filteredItems.length,
      premium_only: premiumOnly,
    });
  }, [deferredSearchTerm, activeTab, sortedComponents.length, filteredItems.length, premiumOnly, analytics]);

  const handleResultClick = useCallback((result: { result_type: SearchResultType; result_name: string; result_position: number }) => {
    if (!searchTerm) return;
    analytics.trackSearchResultClicked({
      search_query: searchTerm,
      ...result,
    });
  }, [searchTerm, analytics]);


  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <Tabs defaultValue="popular" value={activeTab} onValueChange={setActiveTab}>
        <div className="sticky top-0 z-10 bg-background flex flex-col gap-3 mb-4 md:mb-6 py-3">
          <SearchBar
            large
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search registries and components..."
          />

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <TabsList>
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="stars">Stars</TabsTrigger>
              <TabsTrigger value="recently-active">Recently active</TabsTrigger>
            </TabsList>

            <div className="h-4 w-px bg-border" aria-hidden="true" />

            <button
              type="button"
              role="switch"
              aria-checked={premiumOnly}
              onClick={handlePremiumToggle}
              className="group inline-flex items-center gap-2 py-2 font-mono text-sm font-medium transition-colors"
            >
              <span
                aria-hidden="true"
                className={`flex h-4 w-7 items-center border p-0.5 transition-colors ${
                  premiumOnly
                    ? "justify-end border-emerald-500/60 bg-emerald-500/15"
                    : "justify-start border-border bg-transparent"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 transition-colors ${
                    premiumOnly
                      ? "bg-emerald-500 dark:bg-emerald-400"
                      : "bg-muted-foreground group-hover:bg-foreground-secondary"
                  }`}
                />
              </span>
              <span
                className={
                  premiumOnly
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground group-hover:text-foreground-secondary"
                }
              >
                Premium only
              </span>
            </button>
          </div>
        </div>

        <TabsContent value={activeTab}>
          <DirectoryList
            entries={sortedComponents}
            searchTerm={searchTerm}
            addCardLabel="Add your Registry"
            showViewButton={true}
            stats={stats}
            githubStats={githubStats}
            affiliates={affiliates}
            itemResults={filteredItems}
            onResultClick={handleResultClick}
            premiumFilterActive={premiumOnly}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
