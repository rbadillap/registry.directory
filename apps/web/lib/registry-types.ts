/**
 * Registry types imported from shadcn package
 * These types define the structure of /r/registry.json files
 */

import type { RegistryItem as SchemaRegistryItem } from "shadcn/schema"

export type {
  Registry,
  RegistryItem,
  RegistryBaseItem,
} from "shadcn/schema"

export { registrySchema, registryItemSchema } from "shadcn/schema"

/**
 * How far the request for an item's source has got. Paths come from the
 * committed catalog; contents are fetched separately, and the panels that show
 * them need to tell "not yet" from "never" from "the origin refused".
 */
export type SourceStatus =
  | "idle"
  | "loading"
  | "ready"
  | "not-found"
  | "error"

/**
 * What a category listing sends about each of its items.
 *
 * Deliberately partial: a category can hold thousands of items, and a listing
 * reads a name, a title, a description for its filter, and where the first
 * file installs, which is how rows are grouped. Anything else — dependencies,
 * style variables, the rest of the files — stays on the server. Typed as its
 * own shape so a reader can see what does not travel.
 */
export interface RegistryListingItem {
  name: string
  type: SchemaRegistryItem["type"]
  title?: string
  description?: string
  /** The same file shape the schema defines, minus the contents. */
  files?: SchemaRegistryItem["files"]
}

/** A registry as a category listing sees it: its identity, and the rows. */
export interface RegistryListing {
  name: string
  homepage?: string
  items: RegistryListingItem[]
}
