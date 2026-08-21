/**
 * Registry types imported from shadcn package
 * These types define the structure of /r/registry.json files
 */

import type { RegistryItem as SchemaRegistryItem } from "shadcn/schema"

type SchemaFile = NonNullable<SchemaRegistryItem["files"]>[number]

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
 * The one file a listing row knows about: where it installs, and nothing more.
 * Contents are the whole reason a category is heavy, and a row never shows
 * them, so the shape has no room to carry them.
 */
export type RegistryListingFile = Pick<SchemaFile, "path" | "type" | "target">

/**
 * What a category listing sends about each of its items.
 *
 * Deliberately partial: a category can hold thousands of items, and a listing
 * reads a name, a title, a description for its filter, and where the first
 * file installs, which is the file name each row shows. Anything else — dependencies,
 * style variables, the rest of the files — stays on the server. Typed as its
 * own shape so a reader can see what does not travel, and so nothing can be
 * put back in by accident.
 */
export interface RegistryListingItem {
  name: string
  type: SchemaRegistryItem["type"]
  title?: string
  description?: string
  /** Zero files, or exactly the first one. */
  files?: [] | [RegistryListingFile]
}

/** A registry as a category listing sees it: its identity, and the rows. */
export interface RegistryListing {
  name: string
  homepage?: string
  items: RegistryListingItem[]
}

/**
 * What the file tree works with. It draws two things: the files of one
 * component, read from a full record, and the rows of a category, read from
 * listings. This is the ground both stand on — everything the tree touches
 * and nothing either of them lacks.
 *
 * Derived from the schema so the two cannot drift apart when it changes.
 */
export type ViewerFile = Pick<SchemaFile, "path" | "type"> & {
  target?: string
  content?: string
}

export type ViewerItem = Pick<
  SchemaRegistryItem,
  "name" | "type" | "title" | "description"
> & {
  files?: readonly ViewerFile[]
}
