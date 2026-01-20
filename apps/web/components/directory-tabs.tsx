'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { DirectoryList } from './directory-list';
import { SearchBar } from './search-bar';
import type { DirectoryEntry } from '@/lib/types';

interface DirectoryTabsProps {
  components: DirectoryEntry[];
  tools: DirectoryEntry[];
}

export function DirectoryTabs({ components, tools }: DirectoryTabsProps) {
  const [activeTab, setActiveTab] = useState('components');
  const [searchTerm, setSearchTerm] = useState('');

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

  const addComponentUrl = 'https://github.com/rbadillap/registry.directory';
  const addToolUrl = 'https://github.com/rbadillap/registry.directory';

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <Tabs defaultValue="components" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8">
          <TabsList>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <div className="flex-1 w-full sm:w-auto">
            <SearchBar 
              value={searchTerm} 
              onChange={setSearchTerm}
              placeholder={
                activeTab === 'components' 
                  ? "Search components by name, description, or url..."
                  : "Search tools by name, description, or url..."
              }
            />
          </div>
        </div>

        <TabsContent value="components">
          <DirectoryList 
            entries={filteredComponents} 
            searchTerm={searchTerm}
            addCardUrl={addComponentUrl}
            addCardLabel="Add your Component"
          />
        </TabsContent>

        <TabsContent value="tools">
          <DirectoryList 
            entries={filteredTools} 
            searchTerm={searchTerm}
            addCardUrl={addToolUrl}
            addCardLabel="Add your Tool"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
