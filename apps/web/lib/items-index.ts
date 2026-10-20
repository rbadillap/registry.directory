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
  categories: string[]
  registry: {
    name: string
    // Route prefix on registry.directory: "/{owner}/{repo}" or "/{handle}"
    basePath: string
    avatarUrl: string | null
  }
}
