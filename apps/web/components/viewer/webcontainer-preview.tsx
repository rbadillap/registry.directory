"use client"

import { useEffect, useState, useRef } from "react"
import { Loader2, AlertCircle, Terminal, ChevronDown, ChevronUp } from "lucide-react"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
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
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const hasStarted = useRef(false)

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

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
          setLogs(state.logs)
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
      <div className="h-full flex flex-col bg-neutral-950">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            <span className="text-sm text-neutral-300 font-medium">
              {statusMessages[status]}
            </span>
          </div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <Terminal className="h-3 w-3" />
            <span>Terminal</span>
            {showLogs ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Terminal output */}
        {showLogs && (
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4 font-mono text-xs space-y-0.5">
                {logs.length === 0 ? (
                  <p className="text-neutral-600">Waiting for output...</p>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className="text-neutral-400 whitespace-pre-wrap break-all"
                    >
                      {log}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Progress hint */}
        {!showLogs && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-neutral-600">
              Click "Terminal" to see progress
            </p>
          </div>
        )}
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
