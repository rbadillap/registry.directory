'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const DEFAULT_TAB = 'components';
const VALID_TABS = ['components', 'tools'] as const;
type TabValue = (typeof VALID_TABS)[number];

function isValidTab(value: string | null): value is TabValue {
  return value !== null && (VALID_TABS as readonly string[]).includes(value);
}

function buildUrl(searchTerm: string, activeTab: string) {
  const url = new URL(window.location.href);
  if (searchTerm) {
    url.searchParams.set('q', searchTerm);
  } else {
    url.searchParams.delete('q');
  }
  if (activeTab !== DEFAULT_TAB) {
    url.searchParams.set('tab', activeTab);
  } else {
    url.searchParams.delete('tab');
  }
  return url.toString();
}

export function useUrlState() {
  const searchParams = useSearchParams();

  // Read initial values from URL (one-time seed)
  const initialQ = searchParams.get('q') ?? '';
  const rawTab = searchParams.get('tab');
  const initialTab = isValidTab(rawTab) ? rawTab : DEFAULT_TAB;

  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Skip first URL sync on mount
  const isInitialMount = useRef(true);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync search term → URL (debounced 300ms, replaceState)
  useEffect(() => {
    if (isInitialMount.current) return;

    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      window.history.replaceState(null, '', buildUrl(searchTerm, activeTab));
    }, 300);

    return () => clearTimeout(searchTimerRef.current);
  }, [searchTerm, activeTab]);

  // Sync tab → URL (immediate, pushState)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Flush any pending search debounce so pushState captures current search term
    clearTimeout(searchTimerRef.current);
    window.history.pushState(null, '', buildUrl(searchTerm, activeTab));
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      setSearchTerm(url.searchParams.get('q') ?? '');
      const tab = url.searchParams.get('tab');
      setActiveTab(isValidTab(tab) ? tab : DEFAULT_TAB);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { searchTerm, setSearchTerm, activeTab, setActiveTab };
}
