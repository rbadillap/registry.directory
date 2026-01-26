"use client"

import React, { useState, useMemo, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  Diamond,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import type { RegistryItem } from "@/lib/registry-types"
import { getFileName, getTargetPath } from "@/lib/path-utils"
import { useAnalytics } from "@/hooks/use-analytics"

type RegistryFile = NonNullable<RegistryItem["files"]>[number]

export interface FileTreeRef {
  focusSearch: () => void
  clearSearch: () => void
  navigateUp: () => void
  navigateDown: () => void
  expandCollapse: (direction: "left" | "right") => void
  selectFocused: () => void
  getFocusedIndex: () => number
}

interface FileTreeProps {
  items: RegistryItem[]
  selectedItem: RegistryItem | null
  selectedFile: RegistryFile | null
  onSelectFile: (item: RegistryItem, file: RegistryFile) => void
  currentCategory?: string
  onSearchChange?: (query: string) => void
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
  const firstItem = items.length > 0 ? items[0] : null
  const hasContent = Boolean(firstItem?.files?.[0]?.content)

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

export const FileTree = forwardRef<FileTreeRef, FileTreeProps>(function FileTree(
  { items, selectedItem, selectedFile, onSelectFile, currentCategory, onSearchChange },
  ref
) {
  const pathname = usePathname()
  const router = useRouter()
  const analytics = useAnalytics()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    new Set(["components", "components/ui", "lib"]),
  )
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [focusedIndex, setFocusedIndex] = useState<number>(0)

  // Detect if we're viewing a single item (Nivel 3) or category list (Nivel 2)
  const isItemView = selectedItem !== null

  // Detect if items have file content (Nivel 3) or just metadata (Nivel 2)
  const hasFileContent = useMemo(() => {
    if (items.length === 0) return false
    const firstItem = items[0]
    return Boolean(firstItem?.files?.[0]?.content)
  }, [items])

  const pathTree = useMemo(() => buildPathTree(items), [items])

  // Build flat list of navigable items for keyboard navigation (Nivel 2 only)
  const navigableItems = useMemo(() => {
    if (hasFileContent) return [] // Nivel 3 uses tree navigation
    return items
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items, hasFileContent, searchQuery])

  // Reset focused index when search changes or items change
  useEffect(() => {
    setFocusedIndex(-1)
  }, [searchQuery, items])

  // Sync focused index with selected item
  useEffect(() => {
    if (selectedItem && navigableItems.length > 0) {
      const index = navigableItems.findIndex(item => item.name === selectedItem.name)
      if (index !== -1) {
        setFocusedIndex(index)
      }
    }
  }, [selectedItem, navigableItems])

  // Expose imperative methods for keyboard navigation
  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    clearSearch: () => {
      setSearchQuery("")
      onSearchChange?.("")
      searchInputRef.current?.blur()
    },
    navigateUp: () => {
      if (navigableItems.length === 0) return
      setFocusedIndex(prev => {
        if (prev <= 0) return navigableItems.length - 1
        return prev - 1
      })
    },
    navigateDown: () => {
      if (navigableItems.length === 0) return
      setFocusedIndex(prev => {
        if (prev >= navigableItems.length - 1) return 0
        return prev + 1
      })
    },
    expandCollapse: (direction: "left" | "right") => {
      // For Nivel 2, navigate to item on right, go back on left
      if (!hasFileContent && focusedIndex >= 0 && focusedIndex < navigableItems.length) {
        const focusedItem = navigableItems[focusedIndex]
        if (direction === "right" && focusedItem) {
          router.push(`${pathname}/${focusedItem.name}`)
        } else if (direction === "left") {
          // Go back to parent category
          const parentPath = pathname.split("/").slice(0, -1).join("/")
          if (parentPath) router.push(parentPath)
        }
      }
    },
    selectFocused: () => {
      if (!hasFileContent && focusedIndex >= 0 && focusedIndex < navigableItems.length) {
        const focusedItem = navigableItems[focusedIndex]
        if (focusedItem) {
          router.push(`${pathname}/${focusedItem.name}`)
        }
      }
    },
    getFocusedIndex: () => focusedIndex,
  }), [navigableItems, focusedIndex, hasFileContent, pathname, router, onSearchChange])

  // Auto-expand folders when a file is selected
  useEffect(() => {
    if (!selectedFile) return

    const targetPath = getTargetPath(selectedFile)
    const pathParts = targetPath.split('/')

    // Build all folder paths that need to be opened
    const foldersToOpen: string[] = []
    let currentPath = ''

    for (let i = 0; i < pathParts.length - 1; i++) {
      const segment = pathParts[i]
      if (!segment) continue
      currentPath = currentPath ? `${currentPath}/${segment}` : segment
      foldersToOpen.push(currentPath)
    }

    // Open all folders in the path
    if (foldersToOpen.length > 0) {
      setOpenFolders(prev => {
        const next = new Set(prev)
        foldersToOpen.forEach(path => next.add(path))
        return next
      })
    }
  }, [selectedFile])

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      const action = next.has(path) ? "close" : "open"

      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }

      // Track folder toggle with debouncing
      const depthLevel = path.split('/').length
      analytics.trackFolderToggled({
        folder_path: path,
        action,
        depth_level: depthLevel,
      })

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
      case "registry:style":
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
        return Diamond
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
      case "registry:style":
        return Palette
      default:
        return Package
    }
  }

  const getItemFileName = (item: RegistryItem) => {
    const firstFile = item.files?.[0]
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
      const file = item.files?.find(f => getTargetPath(f) === node.path)

      if (file) {
        return (
          <button
            key={node.path}
            onClick={() => {
              onSelectFile(item, file)
              analytics.trackFileSelected({
                file_path: getTargetPath(file),
                file_type: file.type,
                is_multi_file_item: (item.files?.length || 0) > 1,
                total_files_in_item: item.files?.length || 0,
              })
            }}
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
                    if (!blockItem || !blockItem.files) return null

                    return (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {blockItem.files.map((file, index) => (
                          <button
                            key={file.path}
                            onClick={() => {
                              onSelectFile(blockItem, file)
                              analytics.trackFileSelected({
                                file_path: getTargetPath(file),
                                file_type: file.type,
                                is_multi_file_item: (blockItem.files?.length || 0) > 1,
                                total_files_in_item: blockItem.files?.length || 0,
                              })
                            }}
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
                      const isMultiFile = (item.files?.length || 0) > 1
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

                            {isItemOpen && item.files && (
                              <div className="ml-6 mt-0.5 space-y-0.5">
                                {item.files.map((file, index) => (
                                  <button
                                    key={file.path}
                                    onClick={() => {
                                      onSelectFile(item, file)
                                      analytics.trackFileSelected({
                                        file_path: getTargetPath(file),
                                        file_type: file.type,
                                        is_multi_file_item: (item.files?.length || 0) > 1,
                                        total_files_in_item: item.files?.length || 0,
                                      })
                                    }}
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

                      const firstFile = item.files?.[0]
                      if (!firstFile) return null

                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            onSelectFile(item, firstFile)
                            analytics.trackFileSelected({
                              file_path: getTargetPath(firstFile),
                              file_type: firstFile.type,
                              is_multi_file_item: (item.files?.length || 0) > 1,
                              total_files_in_item: item.files?.length || 0,
                            })
                          }}
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

  // If viewing a single item without files, show empty file tree
  if (isItemView && !hasFileContent) {
    return (
      <div className="h-full md:border-r border-neutral-800 bg-black">
        <div className="p-2 md:p-3 border-b border-neutral-800">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Files</span>
        </div>
        <div className="flex items-center justify-center h-[calc(100%-44px)] md:h-[calc(100%-49px)] p-4">
          <p className="text-xs text-neutral-600 text-center">
            No files
          </p>
        </div>
      </div>
    )
  }

  // Render flat list of items (Nivel 2 - no file content)
  if (!hasFileContent) {
    const categoryLabel = currentCategory ? CATEGORY_LABELS[currentCategory] || currentCategory : "Items"

    return (
      <div className="h-full md:border-r border-neutral-800 bg-black">
        <div className="p-2 md:p-3 border-b border-neutral-800">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              onSearchChange?.(e.target.value)

              // Track search usage with debouncing
              if (e.target.value) {
                const filtered = items.filter(item =>
                  item.name.toLowerCase().includes(e.target.value.toLowerCase())
                )
                analytics.trackSearchUsed({
                  search_query: e.target.value,
                  results_count: filtered.length,
                  total_items: items.length,
                })
              }
            }}
            onKeyDown={(e) => {
              // Allow arrow navigation while in search
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setFocusedIndex(prev => {
                  if (prev >= navigableItems.length - 1) return 0
                  return prev + 1
                })
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setFocusedIndex(prev => {
                  if (prev <= 0) return navigableItems.length - 1
                  return prev - 1
                })
              } else if (e.key === "Enter" && focusedIndex >= 0) {
                e.preventDefault()
                const focusedItem = navigableItems[focusedIndex]
                if (focusedItem) {
                  router.push(`${pathname}/${focusedItem.name}`)
                }
              }
            }}
            placeholder={`${categoryLabel} (${items.length})`}
            className="w-full bg-transparent text-xs font-medium text-neutral-500 uppercase tracking-wider placeholder:text-neutral-500 focus:outline-none focus:text-neutral-400"
          />
          {searchQuery && (
            <div className="text-[10px] text-neutral-600 mt-1">
              {navigableItems.length} of {items.length} items
            </div>
          )}
        </div>

        <ScrollArea className="h-[calc(100%-44px)] md:h-[calc(100%-49px)]">
          <div className="p-2 space-y-0.5">
            {navigableItems.length > 0 ? (
              navigableItems.map((item, index) => {
                  const isSelected = selectedItem?.name === item.name
                  const isFocused = focusedIndex === index
                  const Icon = getItemIcon(item.type)

                  return (
                    <Link
                      key={item.name}
                      href={`${pathname}/${item.name}`}
                      className={cn(
                        "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm font-mono",
                        "hover:bg-neutral-800/50 transition-colors",
                        isSelected && "bg-neutral-800",
                        isFocused && "bg-neutral-800/50 ring-1 ring-neutral-500"
                      )}
                    >
                      <Icon className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                      <span className="truncate text-white">{item.name}</span>
                    </Link>
                  )
                })
            ) : (
              <div className="text-center text-neutral-500 text-sm py-4">
                No items found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Render file tree (Nivel 3 - with file content)
  return (
    <div className="h-full md:border-r border-neutral-800 bg-black">
      <div className="p-2 md:p-3 border-b border-neutral-800">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Registry Items</span>
      </div>

      <ScrollArea className="h-[calc(100%-44px)] md:h-[calc(100%-49px)]">
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
})
