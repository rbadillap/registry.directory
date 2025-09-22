import { z } from 'zod'
// Import official shadcn/ui schemas
import { 
  registryItemSchema, 
  registryItemTypeSchema,
  type RegistryItem 
} from 'shadcn/schema'

// File validation schema
export const FileSchema = z.object({
  name: z.string()
    .refine(name => name.endsWith('.tsx') || name.endsWith('.ts'), {
      message: "Only .tsx and .ts files allowed"
    }),
  size: z.number()
    .min(1, "File cannot be empty")
    .max(5 * 1024 * 1024, "File too large (max 5MB)"),
})

// Multiple files validation with all edge cases
export const FileUploadSchema = z.object({
  files: z.array(FileSchema)
    .min(1, "Select at least one file")
    .max(20, "Maximum 20 files allowed")
    .refine(files => {
      // Check for duplicates
      const names = files.map(f => f.name)
      return names.length === new Set(names).size
    }, {
      message: "Duplicate files detected"
    })
})

export type FileUpload = z.infer<typeof FileUploadSchema>
export type ValidatedFile = z.infer<typeof FileSchema>

// Supported registry types for now
export const supportedRegistryTypes = registryItemTypeSchema.exclude([
  "registry:internal",
  "registry:file",
  "registry:page",
  "registry:style",
  "registry:theme",
  "registry:item"
])

// File configuration schema using official shadcn types
export const FileConfigSchema = z.object({
  type: supportedRegistryTypes,
  name: z.string()
    .min(1, "Component name is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes only")
    .refine(name => !name.startsWith('-') && !name.endsWith('-'), {
      message: "Name cannot start or end with a dash"
    }),
  path: z.string()
    .min(1, "File path is required")
    .refine(path => path.endsWith('.tsx') || path.endsWith('.ts'), {
      message: "Path must end with .tsx or .ts"
    })
    .refine(path => path.startsWith('components/ui/'), {
      message: "Path must start with 'components/ui/'"
    })
})

// File configuration state
export const FileConfigurationSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  status: z.enum(['pending', 'configured', 'error']),
  config: FileConfigSchema.optional(),
  error: z.string().optional()
})

// Registry metadata schema
export const RegistryMetadataSchema = z.object({
  name: z.string().min(1, "Registry name is required"),
  description: z.string().optional()
})

export type FileConfig = z.infer<typeof FileConfigSchema>
export type FileConfiguration = z.infer<typeof FileConfigurationSchema>
export type RegistryMetadata = z.infer<typeof RegistryMetadataSchema>

// Re-export official types
export { registryItemSchema, type RegistryItem }
