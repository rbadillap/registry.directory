/**
 * Cross-registry item index types.
 * Data is generated at build time by registry-items.ts.
 */

export interface IndexedItem {
  name: string
  type: string
  // The human name the author gave the item, when there is one: "Voice Orb"
  // for voice-orb. Searched and shown; absent rather than empty.
  title?: string
  description: string
  // The page on the author's own site where the item can be seen working.
  // Absent when the author's sitemap names none.
  demo?: string
  // Set when that page is the item's numbered group's, which shows every
  // variant together: the group's name and how many variants it holds.
  demoGroup?: { label: string; count: number }
  categories: string[]
  registry: {
    name: string
    // Route prefix on registry.directory: "/{owner}/{repo}" or "/{handle}"
    basePath: string
    avatarUrl: string | null
  }
}
