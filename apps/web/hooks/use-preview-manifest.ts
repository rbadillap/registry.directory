"use client"

import { useState, useEffect, useCallback } from "react"

interface PreviewManifest {
  baseUrl: string
  previews: string[]
}

interface UsePreviewManifestResult {
  previews: string[]
  isLoading: boolean
  error: Error | null
  hasPreview: (itemName: string) => boolean
}

const manifestCache = new Map<string, PreviewManifest>()

export function usePreviewManifest(
  previewUrl: string | null
): UsePreviewManifestResult {
  const [previews, setPreviews] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!previewUrl) {
      setPreviews([])
      return
    }

    const cached = manifestCache.get(previewUrl)
    if (cached) {
      setPreviews(cached.previews)
      return
    }

    setIsLoading(true)
    setError(null)

    fetch(`${previewUrl}/api/previews`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch previews: ${res.status}`)
        }
        return res.json()
      })
      .then((data: PreviewManifest) => {
        manifestCache.set(previewUrl, data)
        setPreviews(data.previews)
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)))
        setPreviews([])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [previewUrl])

  const hasPreview = useCallback(
    (itemName: string) => {
      return previews.includes(itemName)
    },
    [previews]
  )

  return { previews, isLoading, error, hasPreview }
}
