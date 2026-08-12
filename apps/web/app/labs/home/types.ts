// Shapes of the blobs that scripts/generate.mjs emits. The page consumes
// these files from Vercel Blob at build time — nothing here is fetched from
// third parties, and nothing is baked into the bundle.

export type LabRegistryCard = {
  name: string
  href: string
  avatar?: string
  description: string
  itemCount?: number
  types?: string[]
  stars?: number
  updated?: string
  updatedDays?: number
  pro?: string[]
  sponsored?: boolean
  evidence?: string
}

export type LabCollection = {
  slug: string
  title: string
  standfirst: string
  criterion: string
  kind: "computed" | "curated"
  registries: LabRegistryCard[]
}

export type CollectionsFile = {
  meta: {
    date: string
    indexesOk?: number
    indexesTotal?: number
    totalItems: number
  }
  collections: LabCollection[]
}

export type ShippedEntry = {
  date: string
  registry: string
  avatar: string | null
  added: string[]
}

export type ShippedFile = {
  date: string
  /** rolling window size in days; absent in pre-window files */
  windowDays?: number
  note?: string
  entries: ShippedEntry[]
}
