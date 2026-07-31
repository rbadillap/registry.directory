'use client';

import { useMemo, useDeferredValue, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { DirectoryList } from './directory-list';
import { SearchBar } from './search-bar';
import { useAnalytics, type SearchResultType } from '@/hooks/use-analytics';
import { useUrlState } from '@/hooks/use-url-state';
import type { DirectoryEntry, GitHubStats, RegistryStats, AffiliateConfig } from '@/lib/types';
import type { IndexedItem } from '@/lib/items-index';
import { searchItems } from '@/lib/search-utils';

type SortMode = 'popular' | 'stars' | 'recently-active';

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

  const filteredComponents = useMemo(() => {
    if (!searchTerm) return components;
    const term = searchTerm.toLowerCase();
    return components.filter(entry =>
      entry.name.toLowerCase().includes(term) ||
      entry.description.toLowerCase().includes(term) ||
      entry.url.toLowerCase().includes(term)
    );
  }, [components, searchTerm]);

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
    });
  }, [deferredSearchTerm, activeTab, sortedComponents.length, filteredItems.length, analytics]);

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
        <div className="sticky top-0 z-10 bg-background flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mb-4 md:mb-6 py-3">
          <TabsList>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="stars">Stars</TabsTrigger>
            <TabsTrigger value="recently-active">Recently active</TabsTrigger>
          </TabsList>

          <div className="flex-1 w-full sm:w-auto">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search registries and components..."
            />
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
