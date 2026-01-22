export type RegistryItemType =
  | "registry:ui"
  | "registry:component"
  | "registry:block"
  | "registry:hook"
  | "registry:lib"
  | "registry:page"
  | "registry:theme"

export type RegistryFile = {
  path: string
  type: RegistryItemType
  code: string
  target: string
}

export interface RegistryItem {
  name: string
  type: RegistryItemType
  description?: string
  files: RegistryFile[]
  dependencies?: string[]
  registryDependencies?: string[]
  author?: {
    name: string
    url?: string
    avatar?: string
  }
}
