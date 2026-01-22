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
