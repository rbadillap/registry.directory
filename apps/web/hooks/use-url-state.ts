'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
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

  // The home is prerendered once, with no query: its HTML is the empty
  // search. Starting from the URL here made the first client render differ
  // from that HTML whenever a link carried ?q=, and React threw it away
  // (error #418). So the first render matches the HTML, and the URL is read
  // right after, in a layout effect, before anything is painted.
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [premiumOnly, setPremiumOnly] = useState(false);
  // True once the URL has been read: state is the address bar's from here on.
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setSearchTerm(searchParams.get('q') ?? '');
    const tab = searchParams.get('tab');
    setActiveTab(isValidTab(tab) ? tab : DEFAULT_TAB);
    setTypeFilters(parseTypes(searchParams.get('type')));
    setPremiumOnly(searchParams.get('premium') === '1');
    setReady(true);
    // Read once, on arrival; afterwards the state writes the URL, not the
    // other way round (back/forward is handled below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skip first URL sync on mount
  const isInitialMount = useRef(true);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync search term → URL (debounced 300ms, replaceState)
  useEffect(() => {
    if (isInitialMount.current) return;

    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const next = buildUrl(searchTerm, activeTab, typeFilters, premiumOnly);
      if (next !== window.location.href) window.history.replaceState(null, '', next);
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
    // Reading the URL on arrival sets this state to what the address bar
    // already says; pushing it again would add a history entry that goes
    // nowhere.
    const next = buildUrl(searchTerm, activeTab, typeFilters, premiumOnly);
    if (next !== window.location.href) window.history.pushState(null, '', next);
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

  return { ready, searchTerm, setSearchTerm, activeTab, setActiveTab, typeFilters, setTypeFilters, premiumOnly, setPremiumOnly };
}
