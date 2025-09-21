import { z } from 'zod'

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
