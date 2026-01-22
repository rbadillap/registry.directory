"use client"

import { useState } from "react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { FileTree } from "./viewer/file-tree"
import { CodeViewer } from "./viewer/code-viewer"
import { InfoPanel } from "./viewer/info-panel"
import { ViewerHeader } from "./viewer/viewer-header"
import { StatusBar } from "./viewer/status-bar"
import { getHardcodedItems } from "@/lib/hardcoded-data"
import type { RegistryItem, RegistryFile } from "@/lib/viewer-types"
import type { DirectoryEntry } from "@/lib/types"

interface RegistryViewerProps {
  registry: DirectoryEntry
}

export function RegistryViewer({ registry }: RegistryViewerProps) {
  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(null)
  const [selectedFile, setSelectedFile] = useState<RegistryFile | null>(null)

  // Get hardcoded items for now
  const items = getHardcodedItems(registry.name)

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
              items={items}
              selectedItem={selectedItem}
              selectedFile={selectedFile}
              onSelectFile={handleSelectFile}
            />
          </Panel>

          <PanelResizeHandle className="w-px bg-neutral-800" />

          <Panel defaultSize={50} minSize={40} maxSize={60}>
            <CodeViewer file={selectedFile} />
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
        githubUrl={registry.github_url}
        onCopyCode={handleCopyCode}
        onShare={handleShare}
      />
    </div>
  )
}
