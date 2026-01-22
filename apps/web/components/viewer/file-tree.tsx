"use client"

import React, { useState, useMemo } from "react"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Palette,
  Package,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import type { RegistryItem, RegistryFile } from "@/lib/viewer-types"

interface FileTreeProps {
  items: RegistryItem[]
  selectedItem: RegistryItem | null
  selectedFile: RegistryFile | null
  onSelectFile: (item: RegistryItem, file: RegistryFile) => void
}

type TreeNode = {
  name: string
  path: string  // Full path to this node (e.g., "components", "components/ui")
  type: 'folder' | 'file' | 'block'
  children: Map<string, TreeNode>
  items: RegistryItem[]  // Items at this level
  files?: RegistryFile[]       // Files if this is a file node (for single-file items)
}

type PathTree = Map<string, TreeNode>

function buildPathTree(items: RegistryItem[]): PathTree {
  const root = new Map<string, TreeNode>()

  for (const item of items) {
    const firstFile = item.files[0]
    if (!firstFile) continue

    const pathParts = firstFile.path.split('/')

    let currentLevel = root
    let currentPath = ''
    let lastFolderNode: TreeNode | undefined = undefined

    // Create folder nodes for all segments except the last one (file name)
    for (let i = 0; i < pathParts.length - 1; i++) {
      const segment = pathParts[i]
      if (!segment) continue
      currentPath = currentPath ? `${currentPath}/${segment}` : segment

      if (!currentLevel.has(segment)) {
        currentLevel.set(segment, {
          name: segment,
          path: currentPath,
          type: 'folder',
          children: new Map(),
          items: [],
        })
      }

      const node = currentLevel.get(segment)!
      lastFolderNode = node
      currentLevel = node.children
    }

    // Add item to the last folder in the path
    if (pathParts.length === 1) {
      // Single-segment path - item is at root level
      const segment = pathParts[0]
      if (!segment) continue
      if (!root.has(segment)) {
        root.set(segment, {
          name: segment,
          path: segment,
          type: item.type === 'registry:block' ? 'block' : 'file',
          children: new Map(),
          items: [item],
        })
      } else {
        const node = root.get(segment)!
        if (!node.items.find(i => i.name === item.name)) {
          node.items.push(item)
        }
      }
    } else if (lastFolderNode) {
      // Multi-segment path
      const lastSegment = pathParts[pathParts.length - 2]
      if (!lastSegment) continue

      if (item.type === 'registry:block' && item.name === lastSegment) {
        lastFolderNode.type = 'block'
        lastFolderNode.items = [item]
        lastFolderNode.children.clear()
      } else {
        if (!lastFolderNode.items.find(i => i.name === item.name)) {
          lastFolderNode.items.push(item)
        }
      }
    }
  }

  return root
}

export function FileTree({ items, selectedItem, selectedFile, onSelectFile }: FileTreeProps) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    new Set(["components", "components/ui", "lib"]),
  )
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const pathTree = useMemo(() => buildPathTree(items), [items])

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const toggleItem = (itemName: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemName)) {
        next.delete(itemName)
      } else {
        next.add(itemName)
      }
      return next
    })
  }

  const getFileIcon = (type: RegistryFile["type"]) => {
    switch (type) {
      case "registry:ui":
      case "registry:component":
        return <FileCode className="h-4 w-4 text-neutral-500" />
      case "registry:hook":
        return <FileCode className="h-4 w-4 text-neutral-500" />
      case "registry:block":
        return <FileCode className="h-4 w-4 text-neutral-500" />
      case "registry:lib":
        return <FileText className="h-4 w-4 text-neutral-500" />
      case "registry:page":
        return <FileCode className="h-4 w-4 text-neutral-500" />
      case "registry:theme":
        return <Palette className="h-4 w-4 text-neutral-500" />
      default:
        return <FileText className="h-4 w-4 text-neutral-500" />
    }
  }

  const getFileName = (path: string) => {
    return path.split("/").pop() || path
  }

  const getItemFileName = (item: RegistryItem) => {
    const firstFile = item.files[0]
    if (!firstFile) return item.name
    const ext = firstFile.path.split(".").slice(1).join(".")
    return ext ? `${item.name}.${ext}` : item.name
  }

  const renderTreeNode = (node: TreeNode, depth: number = 0): React.JSX.Element => {
    const isOpen = openFolders.has(node.path)
    const hasChildren = node.children.size > 0
    const hasItems = node.items.length > 0

    if (node.type === 'file' && !hasChildren && !hasItems) {
      return <></>
    }

    return (
      <div key={node.path} className={cn(depth > 0 && "ml-4 mt-0.5")}>
        {(hasChildren || hasItems || node.type === 'block') && (
          <>
            <button
              onClick={() => toggleFolder(node.path)}
              className={cn(
                "flex items-center gap-1 w-full px-2 py-1.5 rounded hover:bg-rose-700/10 transition-colors text-sm",
                depth === 0 && "mb-1"
              )}
            >
              {hasChildren || hasItems || node.type === 'block' ? (
                <>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-neutral-500" />
                  )}
                  {isOpen ? (
                    <FolderOpen className="h-4 w-4 text-neutral-500" />
                  ) : (
                    <Folder className="h-4 w-4 text-neutral-500" />
                  )}
                </>
              ) : null}
              <span className="ml-1 text-white">{node.name}</span>
              {(hasItems || hasChildren) && (
                <span className="ml-auto text-xs text-neutral-500">
                  {hasItems ? node.items.length : node.children.size}
                </span>
              )}
            </button>

            {isOpen && (hasChildren || hasItems) && (
              <div className="ml-4 mt-1 space-y-0.5">
                {node.type === 'block' && node.items.length > 0 ? (
                  (() => {
                    const blockItem = node.items[0]
                    if (!blockItem) return null

                    return (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {blockItem.files.map((file, index) => (
                          <button
                            key={file.path}
                            onClick={() => onSelectFile(blockItem, file)}
                            className={cn(
                              "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm",
                              "hover:bg-rose-700/10 transition-colors",
                              selectedFile?.path === file.path && "bg-rose-700/20",
                            )}
                          >
                            {getFileIcon(file.type)}
                            <span className="truncate text-neutral-500">{getFileName(file.path)}</span>
                            {index === 0 && (
                              <span className="ml-auto text-[10px] text-neutral-500/60">entry</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )
                  })()
                ) : (
                  [
                  ...Array.from(node.children.values()).map((child) => ({
                    type: 'folder' as const,
                    node: child,
                  })),
                  ...node.items.map((item) => ({
                    type: 'item' as const,
                    item,
                  })),
                ]
                  .sort((a, b) => {
                    if (a.type === 'folder' && b.type === 'item') return -1
                    if (a.type === 'item' && b.type === 'folder') return 1

                    if (a.type === 'folder' && b.type === 'folder') {
                      return a.node.name.localeCompare(b.node.name)
                    }
                    if (a.type === 'item' && b.type === 'item') {
                      return a.item.name.localeCompare(b.item.name)
                    }

                    return 0
                  })
                  .map((entry) => {
                    if (entry.type === 'folder') {
                      return renderTreeNode(entry.node, depth + 1)
                    } else {
                      const item = entry.item
                      const isMultiFile = item.files.length > 1
                      const isItemOpen = openItems.has(item.name)
                      const isItemSelected = selectedItem?.name === item.name

                      if (isMultiFile) {
                        return (
                          <div key={item.name}>
                            <button
                              onClick={() => toggleItem(item.name)}
                              className={cn(
                                "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm font-mono",
                                "hover:bg-rose-700/10 transition-colors",
                                isItemSelected && "bg-rose-700/10",
                              )}
                            >
                              {isItemOpen ? (
                                <ChevronDown className="h-4 w-4 text-neutral-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-neutral-500" />
                              )}
                              <Package className="h-4 w-4 text-neutral-500" />
                              <span className="truncate text-white">{item.name}</span>
                            </button>

                            {isItemOpen && (
                              <div className="ml-6 mt-0.5 space-y-0.5">
                                {item.files.map((file, index) => (
                                  <button
                                    key={file.path}
                                    onClick={() => onSelectFile(item, file)}
                                    className={cn(
                                      "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm font-mono",
                                      "hover:bg-rose-700/10 transition-colors",
                                      selectedFile?.path === file.path && "bg-rose-700/20",
                                    )}
                                  >
                                    {getFileIcon(file.type)}
                                    <span className="truncate text-neutral-500">{getFileName(file.path)}</span>
                                    {index === 0 && (
                                      <span className="ml-auto text-[10px] text-neutral-500/60">entry</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      }

                      const firstFile = item.files[0]
                      if (!firstFile) return null

                      return (
                        <button
                          key={item.name}
                          onClick={() => onSelectFile(item, firstFile)}
                          className={cn(
                            "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm font-mono",
                            "hover:bg-rose-700/10 transition-colors",
                            selectedFile?.path === firstFile.path && "bg-rose-700/20",
                          )}
                        >
                          {getFileIcon(item.type)}
                          <span className="truncate text-neutral-500">{getItemFileName(item)}</span>
                        </button>
                      )
                    }
                  }))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="h-full border-r border-stone-700/50 bg-black">
      <div className="p-3 border-b border-stone-700/50">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Registry Items</span>
      </div>

      <ScrollArea className="h-[calc(100%-49px)]">
        <div className="p-2">
          {Array.from(pathTree.values())
            .sort((a, b) => {
              const aIsFolder = a.type === 'folder' || a.children.size > 0
              const bIsFolder = b.type === 'folder' || b.children.size > 0

              if (aIsFolder && !bIsFolder) return -1
              if (!aIsFolder && bIsFolder) return 1

              return a.name.localeCompare(b.name)
            })
            .map((node) => renderTreeNode(node, 0))}
        </div>
      </ScrollArea>
    </div>
  )
}
