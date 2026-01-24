"use client"

import { useState } from "react"
import { Loader2, ExternalLink, AlertCircle } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

interface PreviewPanelProps {
  registryId: string // Reserved for future use (e.g., theming per registry)
  itemName: string
  baseUrl: string
}

export function PreviewPanel({ registryId: _registryId, itemName, baseUrl }: PreviewPanelProps) {
  // _registryId reserved for future use (e.g., theming per registry)
  void _registryId
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const previewUrl = `${baseUrl}/preview/${itemName}`

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (hasError) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 bg-neutral-950 p-8">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-neutral-700 mx-auto" />
          <div className="space-y-2">
            <p className="text-sm text-neutral-400 font-medium">
              Preview unavailable
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              The preview for this component could not be loaded.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.open(previewUrl, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-2" />
            Open in new tab
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      )}
      <iframe
        src={previewUrl}
        className="w-full h-full border-0"
        title={`Preview of ${itemName}`}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}
