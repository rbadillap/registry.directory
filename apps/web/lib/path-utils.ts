/**
 * Path utilities for cross-platform file path handling
 * Works in both Node.js and browser environments
 */

/**
 * Extracts the filename from a file path
 * @param path - File path (e.g., "lib/utils.ts", "src/components/button.tsx")
 * @returns The filename (e.g., "utils.ts", "button.tsx")
 */
export function getFileName(path: string): string {
  return path.split('/').pop() || path
}

/**
 * Extracts the directory path from a file path
 * @param path - File path (e.g., "lib/utils.ts", "src/components/button.tsx")
 * @returns The directory path (e.g., "lib", "src/components")
 */
export function getDirName(path: string): string {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/') || '.'
}

/**
 * Gets the file extension from a path
 * @param path - File path (e.g., "utils.ts", "component.tsx")
 * @returns The extension without the dot (e.g., "ts", "tsx")
 */
export function getExtension(path: string): string {
  const fileName = getFileName(path)
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
}

/**
 * Infers the target path based on registry conventions
 * @param file - File object with path, target, and type
 * @returns The inferred or actual target path
 */
export function getTargetPath(file: { path: string; target?: string; type: string }): string {
  // If target exists, use it
  if (file.target) {
    return file.target
  }

  const fileName = getFileName(file.path)

  // shadcn convention: registry:ui always goes to components/ui/
  if (file.type === 'registry:ui') {
    return `components/ui/${fileName}`
  }

  // shadcn convention: blocks, components, and examples go to components/
  if (file.type === 'registry:block' || file.type === 'registry:component' || file.type === 'registry:example') {
    return `components/${fileName}`
  }

  // shadcn convention: lib utilities go to lib/
  if (file.type === 'registry:lib') {
    return `lib/${fileName}`
  }

  // shadcn convention: hooks go to hooks/
  if (file.type === 'registry:hook') {
    return `hooks/${fileName}`
  }

  // shadcn convention: pages go to app/ (Next.js App Router)
  if (file.type === 'registry:page') {
    return `app/${fileName}`
  }

  // shadcn convention: config files go to root
  if (file.type === 'registry:file') {
    return fileName
  }

  // Otherwise use path as-is
  return file.path
}
