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
    owner: string
    repo: string
  }
}
