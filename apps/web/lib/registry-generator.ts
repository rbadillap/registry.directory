import { registryItemSchema, type RegistryItem } from 'shadcn/schema'
import type { FileConfiguration, RegistryMetadata } from './schemas'

/**
 * Generate a valid shadcn/ui registry item from file configurations
 */
export async function generateRegistryItem(
  fileConfigurations: FileConfiguration[],
  files: File[],
  metadata: RegistryMetadata
): Promise<RegistryItem> {
  // Filter only configured files
  const configuredFiles = fileConfigurations.filter(
    fc => fc.status === 'configured' && fc.config
  )

  if (configuredFiles.length === 0) {
    throw new Error('No configured files found. Please configure at least one file.')
  }

  // Create a map of fileName to File for easy lookup
  const fileMap = new Map<string, File>()
  files.forEach(file => {
    fileMap.set(file.name, file)
  })

  // Read file contents and create registry files
  const registryFiles = await Promise.all(
    configuredFiles.map(async (fileConfig) => {
      const { config } = fileConfig
      if (!config) throw new Error(`Configuration missing for ${fileConfig.fileName}`)

      // Find the actual File object by name
      const file = fileMap.get(fileConfig.fileName)
      if (!file) throw new Error(`File not found for ${fileConfig.fileName}`)

      // Read file content
      const content = await file.text()

      return {
        path: config.path,
        content,
        type: config.type,
      }
    })
  )

  // Create registry item using official shadcn schema
  const registryItem: RegistryItem = {
    name: metadata.name,
    type: "registry:ui", // Default to UI for MVP
    description: metadata.description,
    files: registryFiles,
  }

  // Validate with official shadcn schema
  return registryItemSchema.parse(registryItem)
}

/**
 * Format registry item as pretty JSON string
 */
export function formatRegistryJson(registryItem: RegistryItem): string {
  return JSON.stringify(registryItem, null, 2)
}
