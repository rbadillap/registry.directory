import { track } from "@vercel/analytics";

// ============================================================================
// Two properties per event
// ============================================================================
//
// Vercel Analytics on the Pro plan keeps two custom properties per event
// (vercel.com/docs/analytics/limits-and-pricing). Every event used to send
// ten — five of device and session, five of registry context, then its own —
// and Vercel does not say which two survive. Each event below names the two
// that answer the question it exists for, and sends nothing else.
//
// Dropped everywhere, and why:
// - device_type, viewport_width, viewport_height: Vercel reports the device.
// - session_id, timestamp: Vercel counts visitors and dates every event.
// - registry_owner, registry_name: one `registry`, the name people know.
// - category, item_type: read from the URL at the wrong depth; never true.

export type AIProvider = "v0" | "chatgpt" | "claude" | "scira";
export type ShareMethod = "native" | "clipboard";
export type ExportMethod = "view" | "ai_share";
export type FolderAction = "open" | "close";
export type MobileTab = "files" | "code" | "info";
export type SearchResultType = "registry" | "item";
export type HomeTab = "popular" | "stars" | "recently-active";

type Value = string | number | boolean | null;

export const ANALYTICS_EVENTS = {
  // Core metrics
  FILE_SELECTED: "ide.file.selected",
  CODE_COPIED: "ide.code.copied",
  INSTALL_COPIED: "ide.install.copied",
  SHARE_CLICKED: "ide.share.clicked",

  // Feature adoption
  AI_CLICKED: "ide.ai.clicked",
  SEARCH_USED: "ide.search.used",
  FOLDER_TOGGLED: "ide.folder.toggled",
  MOBILE_TAB_SWITCHED: "ide.mobile.tab_switched",
  PATH_COPIED: "ide.path.copied",
  MARKDOWN_EXPORTED: "ide.markdown.exported",
  REGISTRY_VISIT: "ide.registry.visit",

  // Home search
  HOME_SEARCH_PERFORMED: "home.search.performed",
  HOME_SEARCH_RESULT_CLICKED: "home.search.result_clicked",

  // Home discovery
  HOME_PREMIUM_TOGGLED: "home.premium.toggled",
  HOME_REGISTRY_VISIT: "home.registry.visit",
  HOME_TYPE_FILTERED: "home.type.filtered",

  // The author's demo page, from an item page or a result card
  DEMO_CLICKED: "demo_clicked",
} as const;

type EventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// What each event sends: exactly two properties, never more.
export interface EventProperties {
  "ide.file.selected": { registry: string | null; file_type: string };
  "ide.code.copied": { registry: string | null; item: string | null };
  "ide.install.copied": { registry: string | null; item: string | null };
  "ide.share.clicked": { share_method: ShareMethod; registry: string | null };
  "ide.ai.clicked": { ai_provider: AIProvider; registry: string | null };
  "ide.search.used": { search_query: string; results_count: number };
  "ide.folder.toggled": { action: FolderAction; depth_level: number };
  "ide.mobile.tab_switched": { to_tab: MobileTab; has_file_selected: boolean };
  "ide.path.copied": { registry: string | null; total_files: number };
  "ide.markdown.exported": { export_method: ExportMethod; registry: string | null };
  "ide.registry.visit": { destination: "registry" | "repository"; registry: string | null };
  "home.search.performed": { search_query: string; item_results_count: number };
  "home.search.result_clicked": { result_type: SearchResultType; result_position: number };
  "home.premium.toggled": { enabled: boolean; has_query: boolean };
  "home.registry.visit": { registry: string; sponsored: boolean };
  "home.type.filtered": { type: string; enabled: boolean };
  "demo_clicked": { surface: "item" | "card"; registry: string | null };
}

// ============================================================================
// Debounce Utility
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// ============================================================================
// Sending
// ============================================================================

const isDevelopment = process.env.NODE_ENV === "development";

export function trackEvent<E extends EventName>(
  event: E,
  properties: EventProperties[E]
): void {
  if (typeof window === "undefined") return;

  if (isDevelopment) {
    // The interface above is the rule; this catches a cast that slipped by it.
    if (Object.keys(properties).length > 2) {
      console.warn("[Analytics]", event, "sends more than two properties; Vercel keeps two.");
    }
    console.log("[Analytics]", event, properties);
    return;
  }

  track(event, properties as Record<string, Value>);
}
