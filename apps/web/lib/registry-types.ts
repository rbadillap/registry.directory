/**
 * Registry types imported from shadcn package
 * These types define the structure of /r/registry.json files
 */

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
