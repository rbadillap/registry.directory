import { usePathname } from "next/navigation";
import { useMemo, useCallback } from "react";
import {
  getAnalytics,
  debounce,
  type FileSelectedProperties,
  type CodeCopiedProperties,
  type ShareClickedProperties,
  type AIClickedProperties,
  type SearchUsedProperties,
  type FolderToggledProperties,
  type MobileTabSwitchedProperties,
  type PathCopiedProperties,
  type MarkdownExportedProperties,
  type RegistryVisitProperties,
  type AIProvider,
  type ShareMethod,
  type ExportMethod,
  type FolderAction,
  type MobileTab,
} from "@/lib/analytics";

interface RegistryContext {
  registry_owner?: string;
  registry_name?: string;
  category?: string;
  item_name?: string;
  item_type?: string;
}

/**
 * Hook for tracking analytics events with automatic context extraction from URL
 *
 * @example
 * const analytics = useAnalytics();
 *
 * // Track file selection
 * analytics.trackFileSelected({
 *   file_path: "Button.tsx",
 *   file_type: "tsx",
 *   is_multi_file_item: true,
 *   total_files_in_item: 3,
 * });
 */
export function useAnalytics() {
  const pathname = usePathname();

  // Extract registry context from pathname
  const context = useMemo((): RegistryContext => {
    if (!pathname) return {};

    // Expected format: /{owner}/{registry}/{category}/{item}
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length < 2) return {};

    return {
      registry_owner: parts[0] || undefined,
      registry_name: parts[1] || undefined,
      category: parts[2] || undefined,
      item_name: parts[3] || undefined,
      item_type: parts[3] ? "registry-item" : undefined,
    };
  }, [pathname]);

  // Get analytics instance
  const analytics = getAnalytics();

  // Create context-aware tracking methods
  const trackFileSelected = useCallback(
    (properties: Omit<FileSelectedProperties, keyof RegistryContext>) => {
      analytics.trackFileSelected({
        ...context,
        ...properties,
      });
    },
    [analytics, context]
  );

  const trackCodeCopied = useCallback(
    (properties: Omit<CodeCopiedProperties, keyof RegistryContext>) => {
      analytics.trackCodeCopied({
        ...context,
        ...properties,
      });
    },
    [analytics, context]
  );

  const trackShareClicked = useCallback(
    (properties: Omit<ShareClickedProperties, keyof RegistryContext>) => {
      analytics.trackShareClicked({
        ...context,
        ...properties,
      });
    },
    [analytics, context]
  );

  const trackAIClicked = useCallback(
    (properties: Omit<AIClickedProperties, keyof RegistryContext>) => {
      analytics.trackAIClicked({
        ...context,
        ...properties,
      });
    },
    [analytics, context]
  );

  const trackSearchUsed = useCallback(
    (properties: Omit<SearchUsedProperties, keyof RegistryContext>) => {
      analytics.trackSearchUsed({
        ...context,
        ...properties,
      });
    },
    [analytics, context]
  );

  const trackFolderToggled = useCallback(
    (properties: Omit<FolderToggledProperties, keyof RegistryContext>) => {
      analytics.trackFolderToggled({
        ...context,
        ...properties,
      });
    },
    [analytics, context]
  );

  const trackMobileTabSwitched = useCallback(
    (properties: Omit<MobileTabSwitchedProperties, keyof RegistryContext>) => {
      analytics.trackMobileTabSwitched({
        ...context,
        ...properties,
      });
    },
    [analytics, context]
  );

  const trackPathCopied = useCallback(
    (properties: Omit<PathCopiedProperties, keyof RegistryContext>) => {
      analytics.trackPathCopied({
        ...context,
        ...properties,
      });
    },
    [analytics, context]
  );

  const trackMarkdownExported = useCallback(
    (properties: Omit<MarkdownExportedProperties, keyof RegistryContext>) => {
      analytics.trackMarkdownExported({
        ...context,
        ...properties,
      });
    },
    [analytics, context]
  );

  const trackRegistryVisit = useCallback(
    (properties: Omit<RegistryVisitProperties, keyof RegistryContext>) => {
      analytics.trackRegistryVisit({
        ...context,
        ...properties,
      });
    },
    [analytics, context]
  );

  // Debounced tracking methods for high-frequency events
  const trackSearchUsedDebounced = useMemo(
    () => debounce(trackSearchUsed, 500),
    [trackSearchUsed]
  );

  const trackFolderToggledDebounced = useMemo(
    () => debounce(trackFolderToggled, 300),
    [trackFolderToggled]
  );

  return {
    // Context
    context,

    // Regular tracking methods
    trackFileSelected,
    trackCodeCopied,
    trackShareClicked,
    trackAIClicked,
    trackPathCopied,
    trackMarkdownExported,
    trackRegistryVisit,
    trackMobileTabSwitched,

    // Debounced methods
    trackSearchUsed: trackSearchUsedDebounced,
    trackFolderToggled: trackFolderToggledDebounced,

    // Direct access to analytics instance for session tracking
    analytics,
  };
}

// Export types for convenience
export type {
  AIProvider,
  ShareMethod,
  ExportMethod,
  FolderAction,
  MobileTab,
};
