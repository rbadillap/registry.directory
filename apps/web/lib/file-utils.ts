/**
 * File utilities for detecting binary files that cannot be rendered as code
 */

// Binary extensions that cannot be rendered as code
const BINARY_EXTENSIONS = new Set([
  // 3D models
  'glb', 'gltf', 'obj', 'fbx', 'stl', 'dae', 'blend',
  // Fonts
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'tiff', 'avif', 'svg',
  // Audio/Video
  'mp3', 'mp4', 'wav', 'webm', 'ogg', 'avi', 'mov', 'flac',
  // Binary/compiled
  'wasm', 'bin', 'dat', 'exe', 'dll', 'so', 'dylib',
  // Archives
  'zip', 'tar', 'gz', 'rar', '7z',
  // Documents (not renderable as code)
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
])

/**
 * Checks if a file extension corresponds to a binary file type
 * @param extension - File extension without the dot (e.g., "png", "wasm")
 * @returns true if the extension is binary
 */
export function isBinaryExtension(extension: string): boolean {
  return BINARY_EXTENSIONS.has(extension.toLowerCase())
}

/**
 * Gets the extension from a file path
 * @param path - File path (e.g., "images/logo.png")
 * @returns The extension without the dot (e.g., "png")
 */
export function getFileExtension(path: string): string {
  const fileName = path.split('/').pop() || path
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
}

/**
 * Checks if all files in an item can be rendered as code
 * Items with only binary files should not have pages generated
 * @param files - Array of file objects with path property
 * @returns true if all files are renderable (non-binary)
 */
export function hasOnlyRenderableFiles(files: Array<{ path: string }> | undefined): boolean {
  // If no files, item is renderable (may only define dependencies)
  if (!files || files.length === 0) return true

  // Item is renderable if at least one file is non-binary
  return files.some(file => {
    const ext = getFileExtension(file.path)
    return !isBinaryExtension(ext)
  })
}
