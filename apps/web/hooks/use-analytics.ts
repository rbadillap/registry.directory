"use client";

import { createContext, createElement, useContext, useMemo, type ReactNode } from "react";
import {
  ANALYTICS_EVENTS,
  debounce,
  trackEvent,
  type AIProvider,
  type ShareMethod,
  type ExportMethod,
  type FolderAction,
  type MobileTab,
  type HomeTab,
  type SearchResultType,
} from "@/lib/analytics";

// The registry and item a page is about, for the events that report them.
// Given by the page rather than parsed from the URL: a route can be
// /{owner}/{repo}/{item} or /{handle}/{item}, and the URL alone cannot tell
// which segment is which. The registry is reported by the name people know
// it by (beUI), not by its GitHub slug.
interface AnalyticsScope {
  registry: string | null;
  item: string | null;
}

const AnalyticsScopeContext = createContext<AnalyticsScope>({
  registry: null,
  item: null,
});

export function AnalyticsScopeProvider({
  registry,
  item = null,
  children,
}: {
  registry: string;
  item?: string | null;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ registry, item }), [registry, item]);
  return createElement(AnalyticsScopeContext.Provider, { value }, children);
}

/**
 * Tracking methods for every event the site sends. Each takes only what the
 * caller knows; the registry and item come from the page's scope.
 */
export function useAnalytics() {
  const { registry, item } = useContext(AnalyticsScopeContext);

  return useMemo(() => {
    const trackSearchUsed = (p: { search_query: string; results_count: number }) =>
      trackEvent(ANALYTICS_EVENTS.SEARCH_USED, p);
    const trackFolderToggled = (p: { action: FolderAction; depth_level: number }) =>
      trackEvent(ANALYTICS_EVENTS.FOLDER_TOGGLED, p);
    const trackSearchPerformed = (p: { search_query: string; item_results_count: number }) =>
      trackEvent(ANALYTICS_EVENTS.HOME_SEARCH_PERFORMED, p);

    return {
      trackFileSelected: (p: { file_type: string }) =>
        trackEvent(ANALYTICS_EVENTS.FILE_SELECTED, { registry, file_type: p.file_type }),
      trackCodeCopied: (p: { via: "button" | "selection" | "install" }) =>
        trackEvent(ANALYTICS_EVENTS.CODE_COPIED, { registry, via: p.via }),
      trackShareClicked: (p: { share_method: ShareMethod }) =>
        trackEvent(ANALYTICS_EVENTS.SHARE_CLICKED, { share_method: p.share_method, registry }),
      trackAIClicked: (p: { ai_provider: AIProvider }) =>
        trackEvent(ANALYTICS_EVENTS.AI_CLICKED, { ai_provider: p.ai_provider, registry }),
      trackPathCopied: (p: { total_files: number }) =>
        trackEvent(ANALYTICS_EVENTS.PATH_COPIED, { registry, total_files: p.total_files }),
      trackMarkdownExported: (p: { export_method: ExportMethod }) =>
        trackEvent(ANALYTICS_EVENTS.MARKDOWN_EXPORTED, { export_method: p.export_method, registry }),
      trackRegistryVisit: (p: { sponsored: boolean }) =>
        trackEvent(ANALYTICS_EVENTS.REGISTRY_VISIT, { registry, sponsored: p.sponsored }),
      trackRepositoryVisit: () =>
        trackEvent(ANALYTICS_EVENTS.REPOSITORY_VISIT, { registry }),
      trackMobileTabSwitched: (p: { to_tab: MobileTab; has_file_selected: boolean }) =>
        trackEvent(ANALYTICS_EVENTS.MOBILE_TAB_SWITCHED, p),

      // Home search
      trackSearchPerformed: debounce(trackSearchPerformed, 500),
      trackSearchResultClicked: (p: { result_type: SearchResultType; result_position: number }) =>
        trackEvent(ANALYTICS_EVENTS.HOME_SEARCH_RESULT_CLICKED, p),

      // Home discovery
      trackPremiumToggled: (p: { enabled: boolean; has_query: boolean }) =>
        trackEvent(ANALYTICS_EVENTS.HOME_PREMIUM_TOGGLED, p),
      trackHomeRegistryVisit: (p: { registry: string; sponsored: boolean }) =>
        trackEvent(ANALYTICS_EVENTS.HOME_REGISTRY_VISIT, p),
      trackTypeFiltered: (p: { type: string; enabled: boolean }) =>
        trackEvent(ANALYTICS_EVENTS.HOME_TYPE_FILTERED, p),

      // The author's demo page. On a card, the registry is the card's own;
      // on an item page, the page's.
      trackDemoClicked: (p: { surface: "item" | "card"; registry?: string }) =>
        trackEvent(ANALYTICS_EVENTS.DEMO_CLICKED, {
          surface: p.surface,
          registry: p.registry ?? registry,
        }),

      // High-frequency events, debounced
      trackSearchUsed: debounce(trackSearchUsed, 500),
      trackFolderToggled: debounce(trackFolderToggled, 300),
    };
  }, [registry, item]);
}

export type {
  AIProvider,
  ShareMethod,
  ExportMethod,
  FolderAction,
  MobileTab,
  HomeTab,
  SearchResultType,
};
