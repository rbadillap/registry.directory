"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Blocks,
  Code2,
  LayoutGrid,
  Component,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import type { RegistryItem, RegistryFile } from "@/lib/viewer-types"
import { getFileName, getTargetPath } from "@/lib/path-utils"

interface FileTreeProps {
  items: RegistryItem[]
  selectedItem: RegistryItem | null
  selectedFile: RegistryFile | null
  onSelectFile: (item: RegistryItem, file: RegistryFile) => void
  currentCategory?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  ui: "UI Components",
  blocks: "Blocks",
  components: "Components",
  hooks: "Hooks",
  lib: "Libraries",
  pages: "Pages",
  themes: "Themes",
  styles: "Styles",
  examples: "Examples",
  base: "Base",
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

  // Check if we have file content - if so, build tree from individual files
  const hasContent = items.length > 0 && items[0].files.length > 0 && items[0].files[0].code !== ""

  for (const item of items) {
    if (!item.files || item.files.length === 0) continue

    // If we have content (Nivel 3), process each file individually
    if (hasContent) {
      for (const file of item.files) {
        const targetPath = getTargetPath(file)
        const pathParts = targetPath.split('/')

        let currentLevel = root
        let currentPath = ''

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

          currentLevel = currentLevel.get(segment)!.children
        }

        // Add the file at the final location
        const fileName = pathParts[pathParts.length - 1]
        if (fileName && !currentLevel.has(fileName)) {
          currentLevel.set(fileName, {
            name: fileName,
            path: targetPath,
            type: 'file',
            children: new Map(),
            items: [item],
          })
        }
      }
      continue
    }

    // Original logic for Nivel 2 (no content)
    const firstFile = item.files[0]
    if (!firstFile) continue

    // Use target instead of path - this is where the file will be installed
    const targetPath = getTargetPath(firstFile)
    const pathParts = targetPath.split('/')

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

export function FileTree({ items, selectedItem, selectedFile, onSelectFile, currentCategory }: FileTreeProps) {
  const pathname = usePathname()
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    new Set(["components", "components/ui", "lib"]),
  )
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  // Detect if items have file content (Nivel 3) or just metadata (Nivel 2)
  const hasFileContent = useMemo(() => {
    if (items.length === 0) return false
    const firstItem = items[0]
    return firstItem.files.length > 0 && firstItem.files[0].code !== ""
  }, [items])

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

  const getItemIcon = (type: RegistryItem["type"]) => {
    switch (type) {
      case "registry:ui":
        return LayoutGrid
      case "registry:component":
        return Component
      case "registry:block":
        return Blocks
      case "registry:hook":
        return Code2
      case "registry:lib":
        return FileText
      case "registry:page":
        return FileCode
      case "registry:theme":
        return Palette
      default:
        return Package
    }
  }

  const getItemFileName = (item: RegistryItem) => {
    const firstFile = item.files[0]
    if (!firstFile) return item.name
    const targetPath = getTargetPath(firstFile)
    const ext = targetPath.split(".").slice(1).join(".")
    return ext ? `${item.name}.${ext}` : item.name
  }

  const renderTreeNode = (node: TreeNode, depth: number = 0): React.JSX.Element => {
    const isOpen = openFolders.has(node.path)
    const hasChildren = node.children.size > 0
    const hasItems = node.items.length > 0

    // Render individual file nodes (Nivel 3 with content)
    if (node.type === 'file' && hasItems && node.items[0]) {
      const item = node.items[0]
      const file = item.files.find(f => getTargetPath(f) === node.path)

      if (file) {
        return (
          <button
            key={node.path}
            onClick={() => onSelectFile(item, file)}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm font-mono",
              "hover:bg-neutral-800/50 transition-colors",
              selectedFile?.path === file.path && "bg-neutral-800",
              depth > 0 && "ml-4 mt-0.5"
            )}
          >
            {getFileIcon(file.type)}
            <span className="truncate text-neutral-500">{node.name}</span>
          </button>
        )
      }
    }

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
                "flex items-center gap-1 w-full px-2 py-1.5 rounded hover:bg-neutral-800/50 transition-colors text-sm",
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
                              "hover:bg-neutral-800/50 transition-colors",
                              selectedFile?.path === file.path && "bg-neutral-800",
                            )}
                          >
                            {getFileIcon(file.type)}
                            <span className="truncate text-neutral-500">{getFileName(getTargetPath(file))}</span>
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
                                "hover:bg-neutral-800/50 transition-colors",
                                isItemSelected && "bg-neutral-800/50",
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
                                      "hover:bg-neutral-800/50 transition-colors",
                                      selectedFile?.path === file.path && "bg-neutral-800",
                                    )}
                                  >
                                    {getFileIcon(file.type)}
                                    <span className="truncate text-neutral-500">{getFileName(getTargetPath(file))}</span>
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
                            "hover:bg-neutral-800/50 transition-colors",
                            selectedFile?.path === firstFile.path && "bg-neutral-800",
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

  // Render flat list of items (Nivel 2 - no file content)
  if (!hasFileContent) {
    const categoryLabel = currentCategory ? CATEGORY_LABELS[currentCategory] || currentCategory : "Items"

    return (
      <div className="h-full border-r border-neutral-800 bg-black">
        <div className="p-3 border-b border-neutral-800">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            {categoryLabel} ({items.length})
          </span>
        </div>

        <ScrollArea className="h-[calc(100%-49px)]">
          <div className="p-2 space-y-0.5">
            {items
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((item) => {
                const isSelected = selectedItem?.name === item.name
                const Icon = getItemIcon(item.type)

                return (
                  <Link
                    key={item.name}
                    href={`${pathname}/${item.name}`}
                    className={cn(
                      "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm font-mono",
                      "hover:bg-neutral-800/50 transition-colors",
                      isSelected && "bg-neutral-800"
                    )}
                  >
                    <Icon className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                    <span className="truncate text-white">{item.name}</span>
                  </Link>
                )
              })}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Render file tree (Nivel 3 - with file content)
  return (
    <div className="h-full border-r border-neutral-800 bg-black">
      <div className="p-3 border-b border-neutral-800">
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
