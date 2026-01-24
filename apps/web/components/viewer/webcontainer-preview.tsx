"use client"

import { useEffect, useState, useRef } from "react"
import { Loader2, AlertCircle, Terminal } from "lucide-react"
import {
  webContainerService,
  buildPreviewFiles,
  type WebContainerStatus,
} from "@/lib/webcontainer"
import type { RegistryItem } from "@/lib/registry-types"

interface WebContainerPreviewProps {
  item: RegistryItem
  previewCode: string
}

const statusMessages: Record<WebContainerStatus, string> = {
  idle: "Initializing...",
  booting: "Booting WebContainer...",
  mounting: "Mounting files...",
  installing: "Installing dependencies...",
  starting: "Starting dev server...",
  ready: "Ready",
  error: "Error",
}

export function WebContainerPreview({
  item,
  previewCode,
}: WebContainerPreviewProps) {
  const [status, setStatus] = useState<WebContainerStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const hasStarted = useRef(false)

  useEffect(() => {
    // Prevent double-start in StrictMode
    if (hasStarted.current) return
    hasStarted.current = true

    let mounted = true

    async function startPreview() {
      try {
        // Subscribe to state changes
        const unsubscribe = webContainerService.subscribe((state) => {
          if (!mounted) return
          setStatus(state.status)
          if (state.error) setError(state.error)
          if (state.previewUrl) setPreviewUrl(state.previewUrl)
        })

        // Build files and run preview
        const files = buildPreviewFiles({ item, previewCode })
        await webContainerService.runPreview(files)

        return () => {
          unsubscribe()
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unknown error")
          setStatus("error")
        }
      }
    }

    startPreview()

    return () => {
      mounted = false
    }
  }, [item, previewCode])

  if (status === "error") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 bg-neutral-950 p-8">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div className="space-y-2">
            <p className="text-sm text-neutral-400 font-medium">
              Preview failed to load
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed font-mono">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status !== "ready" || !previewUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 bg-neutral-950 p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-500 mx-auto" />
          <div className="space-y-2">
            <p className="text-sm text-neutral-400 font-medium">
              {statusMessages[status]}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-600">
              <Terminal className="h-3 w-3" />
              <span>WebContainer</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white">
      <iframe
        ref={iframeRef}
        src={previewUrl}
        className="w-full h-full border-0"
        title={`Preview of ${item.name}`}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  )
}
