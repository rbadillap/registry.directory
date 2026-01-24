import previewConfig from "@/public/preview.json"
import type { PreviewConfig, PreviewRegistry } from "./preview-types"

const config = previewConfig as unknown as PreviewConfig

// Environment variable mapping for preview URLs
const ENV_VARS: Record<string, string | undefined> = {
  NEXT_PUBLIC_SHADCN_PREVIEW_URL: process.env.NEXT_PUBLIC_SHADCN_PREVIEW_URL,
}

// Resolve placeholders like {NEXT_PUBLIC_SHADCN_PREVIEW_URL} to actual env values
function resolveUrl(url: string): string | null {
  const match = url.match(/^\{(.+)\}$/)
  if (match) {
    const envVar = match[1]
    const value = ENV_VARS[envVar]
    return value || null
  }
  return url
}

export function getPreviewConfig(
  registryName: string
): (PreviewRegistry & { id: string }) | null {
  for (const [id, registry] of Object.entries(config.registries)) {
    if (registry.name === registryName) {
      const previewUrl = resolveUrl(registry.previewUrl)
      if (!previewUrl) return null // Env var not set, preview not available
      return { ...registry, previewUrl, id }
    }
  }
  return null
}

export function hasPreview(registryName: string): boolean {
  return getPreviewConfig(registryName) !== null
}
