'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { REGISTRY_TYPE_ORDER } from '@/lib/registry-mappings';

const DEFAULT_TAB = 'popular';
const VALID_TABS = ['popular', 'stars', 'recently-active'] as const;
type TabValue = (typeof VALID_TABS)[number];

function isValidTab(value: string | null): value is TabValue {
  return value !== null && (VALID_TABS as readonly string[]).includes(value);
}

function parseTypes(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter((slug) => REGISTRY_TYPE_ORDER.includes(slug));
}

// The query string of the home in a given state: what the search box, the
// sort, the type facet and the premium filter put in the address bar. A
// return to the results is a return to exactly this.
export function homeSearch(searchTerm: string, activeTab: string, typeFilters: string[], premiumOnly: boolean): string {
  const params = new URLSearchParams();
  if (searchTerm) params.set('q', searchTerm);
  if (activeTab !== DEFAULT_TAB) params.set('tab', activeTab);
  if (typeFilters.length > 0) params.set('type', typeFilters.join(','));
  if (premiumOnly) params.set('premium', '1');
  const query = params.toString();
  return query ? `?${query}` : '';
}

function buildUrl(searchTerm: string, activeTab: string, typeFilters: string[], premiumOnly: boolean) {
  // Only the keys this page owns are rewritten; anything else the address
  // arrived with (a campaign tag, say) stays where it was.
  const url = new URL(window.location.href);
  const own = new URLSearchParams(homeSearch(searchTerm, activeTab, typeFilters, premiumOnly));
  for (const key of ['q', 'tab', 'type', 'premium']) {
    const value = own.get(key);
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  return url.toString();
}

export function useUrlState() {
  const searchParams = useSearchParams();

  // Read initial values from URL (one-time seed)
  const initialQ = searchParams.get('q') ?? '';
  const rawTab = searchParams.get('tab');
  const initialTab = isValidTab(rawTab) ? rawTab : DEFAULT_TAB;
  const initialTypes = parseTypes(searchParams.get('type'));
  const initialPremium = searchParams.get('premium') === '1';

  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [typeFilters, setTypeFilters] = useState<string[]>(initialTypes);
  const [premiumOnly, setPremiumOnly] = useState(initialPremium);

  // Skip first URL sync on mount
  const isInitialMount = useRef(true);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync search term → URL (debounced 300ms, replaceState)
  useEffect(() => {
    if (isInitialMount.current) return;

    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      window.history.replaceState(null, '', buildUrl(searchTerm, activeTab, typeFilters, premiumOnly));
    }, 300);

    return () => clearTimeout(searchTimerRef.current);
  }, [searchTerm, activeTab, typeFilters, premiumOnly]);

  // Sync tab, type facet and premium filter → URL (immediate, pushState)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Flush any pending search debounce so pushState captures current search term
    clearTimeout(searchTimerRef.current);
    window.history.pushState(null, '', buildUrl(searchTerm, activeTab, typeFilters, premiumOnly));
  }, [activeTab, typeFilters, premiumOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      setSearchTerm(url.searchParams.get('q') ?? '');
      const tab = url.searchParams.get('tab');
      setActiveTab(isValidTab(tab) ? tab : DEFAULT_TAB);
      setTypeFilters(parseTypes(url.searchParams.get('type')));
      setPremiumOnly(url.searchParams.get('premium') === '1');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { searchTerm, setSearchTerm, activeTab, setActiveTab, typeFilters, setTypeFilters, premiumOnly, setPremiumOnly };
}
