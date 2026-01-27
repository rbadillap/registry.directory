import type { DirectoryEntry } from "@/lib/types"

type InstallCommandOptions = {
  registry: DirectoryEntry
  itemName: string
  owner: string
  repo: string
}

/**
 * Generates the install command argument for a registry item.
 * Returns the appropriate format based on the registry type.
 */
export function getInstallCommand(options: InstallCommandOptions): string {
  const { registry, itemName, owner, repo } = options

  // Special case: official shadcn uses simple alias
  if (owner === 'shadcn-ui' && repo === 'ui') {
    return itemName
  }

  // Future: if scope is configured
  // if (registry.scope) {
  //   return `@${registry.scope}/${itemName}`
  // }

  // Default: URL to registry JSON
  const baseUrl = registry.registry_url
    ? registry.registry_url.replace(/\/[^/]+\.json$/, '')
    : `${registry.url.replace(/\/$/, '')}/r`

  return `${baseUrl}/${itemName}.json`
}
