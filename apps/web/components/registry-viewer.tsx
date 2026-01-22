"use client"

import { useState, useEffect } from "react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { FileTree } from "./viewer/file-tree"
import { CodeViewer } from "./viewer/code-viewer"
import { InfoPanel } from "./viewer/info-panel"
import { ViewerHeader } from "./viewer/viewer-header"
import { StatusBar } from "./viewer/status-bar"
import type { DirectoryEntry } from "@/lib/types"
import type { Registry, RegistryItem } from "@/lib/registry-types"
import { generateGlobalsCss } from "@/lib/css-utils"

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
  console.log('[RegistryViewer] Rendering with:', {
    registry: registry.name,
    category: currentCategory,
    item: initialItem?.name || 'none',
    totalItems: registryIndex.items.length
  })

  // Add globals.css files to items with cssVars
  const items = registryIndex.items.map(addGlobalsCssFile)
  const processedInitialItem = initialItem ? addGlobalsCssFile(initialItem) : null

  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(processedInitialItem)
  const [selectedFile, setSelectedFile] = useState<RegistryFile | null>(null)

  // Set initial selected file when component mounts or item changes
  useEffect(() => {
    if (!initialItem) {
      setSelectedItem(null)
      setSelectedFile(null)
      return
    }

    const item = addGlobalsCssFile(initialItem)
    const firstFile = item?.files?.[0] || null
    setSelectedItem(item)
    setSelectedFile(firstFile)
    if (firstFile) {
      console.log('[RegistryViewer] Initial file selected:', firstFile.path)
    } else {
      console.log('[RegistryViewer] Item has no files:', item.name)
    }
  }, [initialItem])

  const handleSelectFile = (item: RegistryItem, file: RegistryFile) => {
    setSelectedItem(item)
    setSelectedFile(file)
  }

  const handleCopyCode = () => {
    if (!selectedFile) return

    navigator.clipboard.writeText(selectedFile.code).then(
      () => {
        // TODO: Show toast notification
        console.log("Code copied to clipboard!")
      },
      (err) => {
        console.error("Failed to copy code:", err)
      }
    )
  }

  const handleShare = () => {
    if (!selectedFile) return

    const shareUrl = window.location.href

    if (navigator.share) {
      navigator.share({
        title: `${selectedItem?.name} - ${selectedFile.path}`,
        text: `Check out this component from ${registry.name}`,
        url: shareUrl,
      }).catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Error sharing:", err)
        }
      })
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(shareUrl).then(
        () => {
          // TODO: Show toast notification
          console.log("Link copied to clipboard!")
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

      <div className="flex-1 min-h-0">
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
            <CodeViewer file={selectedFile} selectedItem={selectedItem} />
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
        onCopyCode={handleCopyCode}
        onShare={handleShare}
      />
    </div>
  )
}
