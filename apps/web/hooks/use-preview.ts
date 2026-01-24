"use client"

import { useState, useEffect } from "react"

interface PreviewManifest {
  registries: Record<string, { previews: string[] }>
}

let manifestCache: PreviewManifest | null = null
let manifestPromise: Promise<PreviewManifest> | null = null

async function fetchManifest(): Promise<PreviewManifest> {
  if (manifestCache) return manifestCache
  if (manifestPromise) return manifestPromise

  manifestPromise = fetch("/previews/manifest.json")
    .then((res) => res.json())
    .then((data) => {
      manifestCache = data
      return data
    })

  return manifestPromise
}

function getRegistryKey(registryName: string): string {
  // Map registry display name to the key used in manifest
  // e.g., "shadcn/ui" -> "shadcn/ui"
  return registryName
}

export function usePreview(registryName: string, itemName: string) {
  const [previewCode, setPreviewCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasPreview, setHasPreview] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadPreview() {
      setIsLoading(true)

      try {
        const manifest = await fetchManifest()
        const registryKey = getRegistryKey(registryName)
        const registry = manifest.registries[registryKey]

        if (!registry?.previews.includes(itemName)) {
          if (mounted) {
            setHasPreview(false)
            setPreviewCode(null)
            setIsLoading(false)
          }
          return
        }

        // Fetch the preview code
        const response = await fetch(
          `/previews/${registryKey.replace(/\//g, "-").toLowerCase()}/${itemName}.jsx`
        )

        if (!response.ok) {
          // Try alternate path format
          const altResponse = await fetch(`/previews/shadcn/${itemName}.jsx`)
          if (!altResponse.ok) {
            throw new Error("Preview not found")
          }
          const code = await altResponse.text()
          if (mounted) {
            setPreviewCode(code)
            setHasPreview(true)
          }
        } else {
          const code = await response.text()
          if (mounted) {
            setPreviewCode(code)
            setHasPreview(true)
          }
        }
      } catch (error) {
        console.error("Failed to load preview:", error)
        if (mounted) {
          setHasPreview(false)
          setPreviewCode(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadPreview()

    return () => {
      mounted = false
    }
  }, [registryName, itemName])

  return { previewCode, isLoading, hasPreview }
}
