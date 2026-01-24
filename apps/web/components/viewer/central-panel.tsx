"use client"

import { useState } from "react"
import { Code2, Eye } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { CodeViewer } from "./code-viewer"
import { PreviewPanel } from "./preview-panel"
import type { RegistryItem } from "@/lib/registry-types"

type RegistryFile = NonNullable<RegistryItem["files"]>[number]

type TabType = "code" | "preview"

interface CentralPanelProps {
  file: RegistryFile | null
  selectedItem: RegistryItem | null
  showPreview: boolean
  previewConfig?: {
    registryId: string
    baseUrl: string
  } | null
}

export function CentralPanel({
  file,
  selectedItem,
  showPreview,
  previewConfig,
}: CentralPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("code")

  const tabs = [
    { id: "code" as const, label: "Code", icon: Code2, isNew: false },
    ...(showPreview
      ? [{ id: "preview" as const, label: "Preview", icon: Eye, isNew: true }]
      : []),
  ]

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Tab bar - only show if preview is available */}
      {showPreview && (
        <div className="flex items-center border-b border-neutral-800 bg-neutral-900/50">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative",
                  isActive
                    ? "text-white bg-black"
                    : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.isNew && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-400 border border-rose-500/50 rounded bg-rose-500/10">
                    New
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === "code" ? (
          <CodeViewer file={file} selectedItem={selectedItem} />
        ) : previewConfig && selectedItem ? (
          <PreviewPanel
            registryId={previewConfig.registryId}
            itemName={selectedItem.name}
            baseUrl={previewConfig.baseUrl}
          />
        ) : null}
      </div>
    </div>
  )
}
