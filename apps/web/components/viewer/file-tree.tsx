"use client"

import React, { useState, useMemo, useEffect } from "react"
import Link from "next/link"
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
  Search,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { normalizeForSearch, searchTerms } from "@/lib/search-utils"
import type { SourceStatus, ViewerFile, ViewerItem } from "@/lib/registry-types"
import { getFileName, getTargetPath } from "@/lib/path-utils"
import { REGISTRY_TYPE_LABELS } from "@/lib/registry-mappings"
import { useAnalytics } from "@/hooks/use-analytics"

type RegistryFile = ViewerFile

interface FileTreeProps {
  items: ViewerItem[]
  selectedItem: ViewerItem | null
  selectedFile: RegistryFile | null
  onSelectFile: (item: ViewerItem, file: ViewerFile) => void
  currentCategory?: string
  // Route prefix ("/{owner}/{repo}" or "/{handle}") for sibling item links
  basePath: string
  /** Whether the item's files have arrived. An item with no files yet and an
   *  item with no files at all look the same until this says which it is. */
  sourceStatus?: SourceStatus
}

type TreeNode = {
  name: string
  path: string  // Full path to this node (e.g., "components", "components/ui")
  type: 'folder' | 'file' | 'block'
  children: Map<string, TreeNode>
  items: ViewerItem[]  // Items at this level
  files?: RegistryFile[]       // Files if this is a file node (for single-file items)
}

type PathTree = Map<string, TreeNode>
/**
 * The folder tree for one component: its files, nested by where each one
 * installs.
 *
 * Only the item view draws a tree. The branch that grouped a category's
 * items by folder was computed and then thrown away, so it is gone; Git
 * keeps it if grouping ever becomes a requirement.
 */

function buildPathTree(items: ViewerItem[]): PathTree {
  const root = new Map<string, TreeNode>()

  for (const item of items) {
    if (!item.files || item.files.length === 0) continue

    // Reading one component: its files are the tree.
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
  }

  return root
}

export function FileTree({ items, selectedItem, selectedFile, onSelectFile, currentCategory, basePath, sourceStatus = "ready" }: FileTreeProps) {
  const analytics = useAnalytics()

  const [openFolders, setOpenFolders] = useState<Set<string>>(
    new Set(["components", "components/ui", "lib"]),
  )
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Which view this is, stated rather than guessed. A category can hold
  // exactly one item, so counting them answers a different question.
  const isItemView = selectedItem !== null

  // Only the item view renders a tree; a category renders a list. Building
  // one for a category walked every item to group it by folder and then threw
  // the result away — several thousand items, on every render, for nothing.
  const pathTree = useMemo(
    () => (isItemView ? buildPathTree(items) : new Map<string, TreeNode>()),
    [items, isItemView]
  )

  // The shape of the panel and whether it has anything to show are separate
  // questions: an item always renders as a tree, and that tree is empty while
  // its files are still on their way.
  const treeIsEmpty = pathTree.size === 0

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
        return <FileCode className="h-4 w-4 text-muted-foreground" />
      case "registry:hook":
        return <FileCode className="h-4 w-4 text-muted-foreground" />
      case "registry:block":
        return <FileCode className="h-4 w-4 text-muted-foreground" />
      case "registry:lib":
        return <FileText className="h-4 w-4 text-muted-foreground" />
      case "registry:page":
        return <FileCode className="h-4 w-4 text-muted-foreground" />
      case "registry:theme":
        return <Palette className="h-4 w-4 text-muted-foreground" />
      case "registry:style":
        return <Palette className="h-4 w-4 text-muted-foreground" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getItemIcon = (type: ViewerItem["type"]) => {
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

  const getItemFileName = (item: ViewerItem) => {
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

    // Reading one component: render its files.
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
              "hover:bg-accent transition-colors",
              selectedFile?.path === file.path && "bg-surface-elevated",
              depth > 0 && "ml-4 mt-0.5"
            )}
          >
            {getFileIcon(file.type)}
            <span className="truncate text-muted-foreground">{node.name}</span>
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
                "flex items-center gap-1 w-full px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm",
                depth === 0 && "mb-1"
              )}
            >
              {hasChildren || hasItems || node.type === 'block' ? (
                <>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  {isOpen ? (
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Folder className="h-4 w-4 text-muted-foreground" />
                  )}
                </>
              ) : null}
              <span className="ml-1 text-foreground">{node.name}</span>
              {(hasItems || hasChildren) && (
                <span className="ml-auto text-xs text-muted-foreground">
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
                              "hover:bg-accent transition-colors",
                              selectedFile?.path === file.path && "bg-surface-elevated",
                            )}
                          >
                            {getFileIcon(file.type)}
                            <span className="truncate text-muted-foreground">{getFileName(getTargetPath(file))}</span>
                            {index === 0 && (
                              <span className="ml-auto text-[10px] text-muted-foreground/60">entry</span>
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
                                "hover:bg-accent transition-colors",
                                isItemSelected && "bg-surface-elevated/50",
                              )}
                            >
                              {isItemOpen ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate text-foreground">{item.name}</span>
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
                                      "hover:bg-accent transition-colors",
                                      selectedFile?.path === file.path && "bg-surface-elevated",
                                    )}
                                  >
                                    {getFileIcon(file.type)}
                                    <span className="truncate text-muted-foreground">{getFileName(getTargetPath(file))}</span>
                                    {index === 0 && (
                                      <span className="ml-auto text-[10px] text-muted-foreground/60">entry</span>
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
                            "hover:bg-accent transition-colors",
                            selectedFile?.path === firstFile.path && "bg-surface-elevated",
                          )}
                        >
                          {getFileIcon(item.type)}
                          <span className="truncate text-muted-foreground">{getItemFileName(item)}</span>
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

  // An item whose tree is empty: either its files have not arrived yet, or
  // the registry never declared any. Saying "no files" before knowing which
  // is a guess presented as a fact.
  if (isItemView && treeIsEmpty) {
    return (
      <div className="h-full md:border-r border-border bg-background">
        <div className="p-2 md:p-3 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Files</span>
        </div>
        <div className="flex items-center justify-center h-[calc(100%-44px)] md:h-[calc(100%-49px)] p-4">
          <p className="text-xs text-foreground-subtle text-center">
            {sourceStatus === "ready" ? "No files" : "—"}
          </p>
        </div>
      </div>
    )
  }

  // Browsing a category: its items are the list.
  if (!isItemView) {
    const categoryLabel = currentCategory ? REGISTRY_TYPE_LABELS[currentCategory] || currentCategory : "Items"

    // Every word has to appear somewhere, and hyphens count as spaces on both
    // sides: someone looking for "alert dialog" means alert-dialog, and typing
    // the words in the order the component publishes them is not a skill worth
    // requiring.
    const terms = searchTerms(searchQuery)
    const filteredItems = terms.length === 0
      ? items
      : items.filter((item) => {
          const haystack = normalizeForSearch(
            [item.name, item.title, item.description].filter(Boolean).join(" ")
          )
          return terms.every((term) => haystack.includes(term))
        })

    return (
      <div className="h-full md:border-r border-border bg-background">
        <div className="p-2 md:p-3 border-b border-border">
          {/* The field was a bare line of label-looking text: it read as a
              heading rather than as somewhere to type. */}
          <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)

              // Counts what the person sees. Filtering a second time here,
              // by a different rule, reported zero results for searches that
              // were showing some.
              if (e.target.value) {
                const terms = searchTerms(e.target.value)
                const matched = items.filter((item) => {
                  const haystack = normalizeForSearch(
                    [item.name, item.title, item.description].filter(Boolean).join(" ")
                  )
                  return terms.every((term) => haystack.includes(term))
                })
                analytics.trackSearchUsed({
                  search_query: e.target.value,
                  results_count: matched.length,
                  total_items: items.length,
                })
              }
            }}
            placeholder={`Search (${items.length} ${categoryLabel.toLowerCase()})`}
            className="w-full bg-transparent text-xs font-medium text-foreground uppercase tracking-wider placeholder:text-muted-foreground focus:outline-none"
          />
          </div>
          {searchQuery && (
            <div className="text-[10px] text-foreground-subtle mt-1">
              {filteredItems.length} of {items.length} items
            </div>
          )}
        </div>

        <ScrollArea className="h-[calc(100%-44px)] md:h-[calc(100%-49px)]">
          <div className="p-2 space-y-0.5">
            {filteredItems.length > 0 ? (
              filteredItems
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => {
                  // Nothing is selected in a category listing — selecting an
                  // item is what navigates away from it.
                  const Icon = getItemIcon(item.type)

                  return (
                    <Link
                      key={`${item.type}-${item.name}`}
                      href={`${basePath}/${item.name}`}
                      className={cn(
                        "flex items-start gap-2 w-full px-2 py-1.5 rounded",
                        "hover:bg-accent transition-colors",
                        // A megacatalogue category is thousands of rows. Only
                        // the visible ones are worth laying out and painting.
                        "list-row-deferred",
                      )}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="block truncate text-sm text-foreground">
                          {item.title || item.name}
                        </span>
                        {item.title && (
                          <span className="block truncate text-xs font-mono text-foreground-subtle">
                            {item.name}
                          </span>
                        )}
                        {item.description && (
                          <span className="block truncate text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })
            ) : (
              <div className="text-center text-muted-foreground text-sm py-4">
                No items found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Reading one component: the tree of its files.
  return (
    <div className="h-full md:border-r border-border bg-background">
      <div className="p-2 md:p-3 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Registry Items</span>
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
}
