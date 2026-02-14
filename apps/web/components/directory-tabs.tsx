'use client';

import { useState, useMemo, useDeferredValue } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { DirectoryList } from './directory-list';
import { SearchBar } from './search-bar';
import type { DirectoryEntry, GitHubStats, RegistryStats } from '@/lib/types';
import type { IndexedItem } from '@/lib/items-index';

interface DirectoryTabsProps {
  components: DirectoryEntry[];
  tools: DirectoryEntry[];
  stats: Record<string, RegistryStats>;
  githubStats: Record<string, Omit<GitHubStats, 'fetchedAt'>>;
  items: IndexedItem[];
}

export function DirectoryTabs({ components, tools, stats, githubStats, items }: DirectoryTabsProps) {
  const [activeTab, setActiveTab] = useState('components');
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredTools = useMemo(() => {
    if (!searchTerm) return tools;
    const term = searchTerm.toLowerCase();
    return tools.filter(entry => 
      entry.name.toLowerCase().includes(term) ||
      entry.description.toLowerCase().includes(term) ||
      entry.url.toLowerCase().includes(term)
    );
  }, [tools, searchTerm]);

  const filteredItems = useMemo(() => {
    if (!deferredSearchTerm) return [];
    const term = deferredSearchTerm.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.categories.some(c => c.toLowerCase().includes(term))
    );
  }, [items, deferredSearchTerm]);

  const addComponentUrl = 'https://github.com/rbadillap/registry.directory';
  const addToolUrl = 'https://github.com/rbadillap/registry.directory';

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <Tabs defaultValue="components" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mb-4 md:mb-6">
          <TabsList>
            <TabsTrigger value="components">Registries</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <div className="flex-1 w-full sm:w-auto">
            <SearchBar 
              value={searchTerm} 
              onChange={setSearchTerm}
              placeholder={
                activeTab === 'components' 
                  ? "Search registries and components..."
                  : "Search tools..."
              }
            />
          </div>
        </div>

        <TabsContent value="components">
          <DirectoryList
            entries={filteredComponents}
            searchTerm={searchTerm}
            addCardUrl={addComponentUrl}
            addCardLabel="Add your Registry"
            showViewButton={true}
            stats={stats}
            githubStats={githubStats}
            itemResults={activeTab === 'components' ? filteredItems : []}
          />
        </TabsContent>

        <TabsContent value="tools">
          <DirectoryList
            entries={filteredTools}
            searchTerm={searchTerm}
            addCardUrl={addToolUrl}
            addCardLabel="Add your Tool"
            showViewButton={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
