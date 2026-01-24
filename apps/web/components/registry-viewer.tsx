"use client"

import { useState, useEffect } from "react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { FileTree } from "./viewer/file-tree"
import { CodeViewer } from "./viewer/code-viewer"
import { CentralPanel } from "./viewer/central-panel"
import { PreviewPanel } from "./viewer/preview-panel"
import { InfoPanel } from "./viewer/info-panel"
import { ViewerHeader } from "./viewer/viewer-header"
import { StatusBar } from "./viewer/status-bar"
import { MobileTabNavigation, type MobileTab } from "./viewer/mobile-tab-navigation"
import { cn } from "@workspace/ui/lib/utils"
import type { DirectoryEntry } from "@/lib/types"
import type { Registry, RegistryItem } from "@/lib/registry-types"
import { generateGlobalsCss } from "@/lib/css-utils"
import { useAnalytics } from "@/hooks/use-analytics"
import { getTargetPath } from "@/lib/path-utils"
import { getPreviewConfig } from "@/lib/preview-utils"
import { usePreviewManifest } from "@/hooks/use-preview-manifest"

interface RegistryViewerProps {
  registry: DirectoryEntry
  registryIndex: Registry
  selectedItem: RegistryItem | null
  currentCategory: string
}

type RegistryFile = NonNullable<RegistryItem["files"]>[number]

// Add globals.css file if item has cssVars
function addGlobalsCssFile(item: RegistryItem): RegistryItem {
  if (!item.cssVars) return item

  const globalsCssContent = generateGlobalsCss(item.cssVars)
  const files = [...(item.files || [])]

  files.push({
    path: "globals.css",
    type: "registry:style",
    content: globalsCssContent,
    target: "globals.css"
  })

  return {
    ...item,
    files
  }
}

export function RegistryViewer({ registry, registryIndex, selectedItem: initialItem, currentCategory }: RegistryViewerProps) {
  const analytics = useAnalytics()

  // Get preview configuration for this registry
  const previewConfig = getPreviewConfig(registry.name)
  const { hasPreview: checkHasPreview } = usePreviewManifest(previewConfig?.previewUrl ?? null)

  // Add globals.css files to items with cssVars
  const items = registryIndex.items.map(addGlobalsCssFile)
  const processedInitialItem = initialItem ? addGlobalsCssFile(initialItem) : null

  // Determine initial tab: 'code' if there's a file, 'files' otherwise
  const initialTab: MobileTab = processedInitialItem?.files?.[0] ? 'code' : 'files'

  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(processedInitialItem)
  const [selectedFile, setSelectedFile] = useState<RegistryFile | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>(initialTab)

  // Check if the current item has a preview available
  const showPreview = Boolean(
    previewConfig && selectedItem && checkHasPreview(selectedItem.name)
  )

  // Set initial selected file when component mounts or item changes
  useEffect(() => {
    if (!initialItem) {
      setSelectedItem(null)
      setSelectedFile(null)
      setMobileTab('files') // Reset to files when no item
      return
    }

    const item = addGlobalsCssFile(initialItem)
    const firstFile = item?.files?.[0] || null
    setSelectedItem(item)
    setSelectedFile(firstFile)

    // Set tab based on whether there's a file
    setMobileTab(firstFile ? 'code' : 'files')
  }, [initialItem])

  const handleSelectFile = (item: RegistryItem, file: RegistryFile) => {
    setSelectedItem(item)
    setSelectedFile(file)
    // Auto-switch to code tab on mobile when file is selected
    setMobileTab('code')
  }

  const handleShare = () => {
    if (!selectedFile) return

    const shareUrl = window.location.href

    if (navigator.share) {
      navigator.share({
        title: `${selectedItem?.name} - ${selectedFile.path}`,
        text: `Check out this component from ${registry.name}`,
        url: shareUrl,
      }).then(() => {
        // Track successful native share
        analytics.trackShareClicked({
          share_method: "native",
          file_path: getTargetPath(selectedFile),
        })
      }).catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Error sharing:", err)
        }
      })
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(shareUrl).then(
        () => {
          // Track clipboard fallback
          analytics.trackShareClicked({
            share_method: "clipboard",
            file_path: getTargetPath(selectedFile),
          })
          // TODO: Show toast notification
        },
        (err) => {
          console.error("Failed to copy link:", err)
        }
      )
    }
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <ViewerHeader registry={registry} />

      {/* Mobile Tab Navigation - only visible on mobile */}
      <MobileTabNavigation
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        hasFile={!!selectedFile}
        showPreview={showPreview}
      />

      {/* Mobile Content - one panel at a time */}
      <div className="md:hidden flex-1 min-h-0">
        <div className={cn("h-full", mobileTab !== 'files' && "hidden")}>
          <FileTree
            items={selectedItem ? [selectedItem] : items}
            selectedItem={selectedItem}
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
            currentCategory={currentCategory}
          />
        </div>
        <div className={cn("h-full", mobileTab !== 'code' && "hidden")}>
          <CodeViewer file={selectedFile} selectedItem={selectedItem} />
        </div>
        {showPreview && previewConfig && selectedItem && (
          <div className={cn("h-full", mobileTab !== 'preview' && "hidden")}>
            <PreviewPanel
              registryId={previewConfig.id}
              itemName={selectedItem.name}
              baseUrl={previewConfig.previewUrl}
            />
          </div>
        )}
        <div className={cn("h-full", mobileTab !== 'info' && "hidden")}>
          <InfoPanel item={selectedItem} />
        </div>
      </div>

      {/* Desktop Content - 3-column layout */}
      <div className="hidden md:flex md:flex-1 md:min-h-0">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={25} minSize={20} maxSize={35}>
            <FileTree
              items={selectedItem ? [selectedItem] : items}
              selectedItem={selectedItem}
              selectedFile={selectedFile}
              onSelectFile={handleSelectFile}
              currentCategory={currentCategory}
            />
          </Panel>

          <PanelResizeHandle className="w-px bg-neutral-800" />

          <Panel defaultSize={50} minSize={40} maxSize={60}>
            <CentralPanel
              file={selectedFile}
              selectedItem={selectedItem}
              showPreview={showPreview}
              previewConfig={previewConfig ? {
                registryId: previewConfig.id,
                baseUrl: previewConfig.previewUrl,
              } : null}
            />
          </Panel>

          <PanelResizeHandle className="w-px bg-neutral-800" />

          <Panel defaultSize={25} minSize={20} maxSize={35}>
            <InfoPanel item={selectedItem} />
          </Panel>
        </PanelGroup>
      </div>

      <StatusBar
        totalItems={items.length}
        selectedFile={selectedFile}
        onShare={handleShare}
      />
    </div>
  )
}
