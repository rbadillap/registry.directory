'use client';

import Image from "next/image";
import { ExternalLink, Search, Filter, Grid, List, Star, Code, Download } from "lucide-react";
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
import { getHostname } from "@/lib/utils";
import type { DirectoryEntry } from "@/lib/types";
import { useMemo, useState } from "react";

const addUtmReference = (url: string) => {
  try {
    const u = new URL(url)
    u.searchParams.set("utm_source", "registry.directory")
    u.searchParams.set("utm_medium", "directory")
    u.searchParams.set("utm_campaign", "registry_preview")
    return u.toString()
  } catch {
    return url
  }
}

export function DirectoryList({ entries }: { entries: DirectoryEntry[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = useMemo(() => {
    const cats = new Set(entries.map(entry => entry.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.name.toLowerCase().includes(term) ||
        entry.description.toLowerCase().includes(term) ||
        entry.url.toLowerCase().includes(term) ||
        (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }
    
    return filtered;
  }, [entries, searchTerm, selectedCategory]);

  return (
    <div className="w-full">
      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search registries, tags, or descriptions..."
              className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {categories.map(category => (
                <option key={category} value={category} className="capitalize">
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-neutral-400">
          {filteredEntries.length} of {entries.length} registries
        </div>
      </div>

      {/* Results */}
      {filteredEntries.length === 0 ? (
        <div className="py-12">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-neutral-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No registries found</h3>
          <p className="text-neutral-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 max-w-4xl mx-auto'
        }`}>
          {filteredEntries.map((entry) => (
            <RegistryCard 
              key={entry.url} 
              entry={entry} 
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RegistryCard({ entry, viewMode }: { entry: DirectoryEntry; viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <a
        href={addUtmReference(entry.url)}
        target="_blank"
        rel="noreferrer"
        className="block group"
      >
        <Card className="group bg-neutral-900 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/70 transition-all duration-300 cursor-pointer">
          <div className="flex">
            {/* Preview Image */}
            <div className="w-48 h-32 bg-neutral-800 flex-shrink-0">
              <Image
                src={`/og/image/${encodeURIComponent(entry.url)}`}
                alt={`${entry.name} registry preview`}
                className="object-cover w-full h-full"
                loading="lazy"
                width={192}
                height={128}
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {entry.logo && (
                    <div className="w-8 h-8 rounded-lg bg-white/5 p-1 flex items-center justify-center">
                      <Image
                        src={entry.logo}
                        alt={`${entry.name} logo`}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg text-white group-hover:text-rose-400 transition-colors">
                      {entry.name}
                    </CardTitle>
                    {entry.category && (
                      <span className="text-xs text-rose-400">
                        {entry.category}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="px-3 py-1 border border-slate-600/50 text-neutral-300 group-hover:bg-slate-800/50 group-hover:border-slate-500 group-hover:text-slate-300 text-xs rounded-md transition-all">
                    <ExternalLink className="w-3 h-3 mr-1 inline" />
                    Visit
                  </div>
                  <div className="px-3 py-1 bg-rose-700 group-hover:bg-rose-800 text-white text-xs rounded-md transition-all">
                    <Download className="w-3 h-3 mr-1 inline" />
                    Install
                  </div>
                </div>
              </div>
              
              <CardDescription className="text-neutral-300 mb-3">
                {entry.description}
              </CardDescription>
              
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-neutral-800 text-neutral-400 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                  {entry.tags.length > 3 && (
                    <span className="px-2 py-1 bg-neutral-800 text-neutral-500 text-xs rounded-md">
                      +{entry.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </a>
    );
  }

  return (
    <a
      href={addUtmReference(entry.url)}
      target="_blank"
      rel="noreferrer"
      className="block group"
    >
      <Card className="group bg-neutral-900 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/70 transition-all duration-300 cursor-pointer">
        {/* Preview Image */}
        <div className="aspect-video bg-neutral-800 relative overflow-hidden">
          <Image
            src={`/og/image/${encodeURIComponent(entry.url)}`}
            alt={`${entry.name} registry preview`}
            className="object-cover w-full h-full"
            loading="lazy"
            width={320}
            height={180}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Content */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {entry.logo && (
                <div className="w-10 h-10 rounded-lg bg-white/5 p-2 flex items-center justify-center flex-shrink-0">
                  <Image
                    src={entry.logo}
                    alt={`${entry.name} logo`}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg text-white group-hover:text-rose-400 transition-colors truncate">
                  {entry.name}
                </CardTitle>
                {entry.category && (
                  <span className="text-xs text-rose-400">
                    {entry.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <CardDescription className="text-neutral-300 text-sm leading-relaxed mb-3">
            {entry.description}
          </CardDescription>
          
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-neutral-800 text-neutral-400 text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
              {entry.tags.length > 3 && (
                <span className="px-2 py-1 bg-neutral-800 text-neutral-500 text-xs rounded-md">
                  +{entry.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-neutral-500 group-hover:text-neutral-300 transition-colors truncate">
              {getHostname(entry.url)}
            </span>
            
            <div className="flex gap-2">
              <div className="px-3 py-1 border border-slate-600/50 text-neutral-300 group-hover:bg-slate-800/50 group-hover:border-slate-500 group-hover:text-slate-300 text-xs rounded-md transition-all">
                <ExternalLink className="w-3 h-3 mr-1 inline" />
                Visit
              </div>
              
              <div className="px-3 py-1 bg-rose-700 group-hover:bg-rose-800 text-white text-xs rounded-md transition-all">
                <Download className="w-3 h-3 mr-1 inline" />
                Install
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </a>
  );
} 