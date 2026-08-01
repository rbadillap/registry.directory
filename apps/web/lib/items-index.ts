/**
 * Cross-registry item index types.
 * Data is generated at build time by registry-items.ts.
 */

export interface IndexedItem {
  name: string
  type: string
  description: string
  categories: string[]
  registry: {
    name: string
    // Route prefix on registry.directory: "/{owner}/{repo}" or "/{handle}"
    basePath: string
    avatarUrl: string | null
  }
}
