"use client"

import { useState, useEffect } from "react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { FileTree } from "./viewer/file-tree"
import { CodeViewer } from "./viewer/code-viewer"
import { InfoPanel } from "./viewer/info-panel"
import { ViewerHeader } from "./viewer/viewer-header"
import { ItemBar } from "./viewer/item-bar"
import { PreviewButton } from "./viewer/preview-button"
import { SourceUnavailable, type SourceUnavailableKind } from "./viewer/source-unavailable"
import { StatusBar } from "./viewer/status-bar"
import { MobileTabNavigation, type MobileTab } from "./viewer/mobile-tab-navigation"
import { cn } from "@workspace/ui/lib/utils"
import type { DirectoryEntry, AffiliateConfig } from "@/lib/types"
import type { ItemResolution } from "@/lib/registry-data"
import type { RegistryListing, RegistryItem, SourceStatus, ViewerFile, ViewerItem } from "@/lib/registry-types"
import { generateGlobalsCss } from "@/lib/css-utils"
import { useAnalytics } from "@/hooks/use-analytics"
import { addUtmParams } from "@/lib/utm-utils"
import { REGISTRY_TYPE_LABELS } from "@/lib/registry-mappings"

interface RegistryViewerProps {
  registry: DirectoryEntry
  registryIndex: RegistryListing
  /** The registry's handle in the aggregated catalog, used to fetch file
   *  contents from /r/{handle}/{item}.json once a reader opens a file. */
  handle: string
  /** How many items the category holds. Sent as a number because reading one
   *  item does not need the other thousands, only their count. */
  categorySize: number
  selectedItem: RegistryItem | null
  currentCategory: string
  affiliate?: AffiliateConfig | null
  // Route prefix the viewer lives under: "/{owner}/{repo}" or "/{handle}"
  basePath: string
  /** For an item page: what follows `npx shadcn@latest add` for it. */
  installArg?: string
  /** For an item page: what the indexer's probe found at its origin. */
  itemResolution?: ItemResolution
  /** For an item page: the author's demo page, when there is one. */
  demoUrl?: string
}

type RegistryFile = ViewerFile

// "not-found" is the origin answering that this item is not there, which is a
// different fact from a request that failed: one says the catalog is stale,
// the other says the network is.
type SourceState =
  | { status: Exclude<SourceStatus, "error"> }
  | { status: "error"; message: string }

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

export function RegistryViewer({ registry, registryIndex, handle, categorySize, selectedItem: initialItem, currentCategory, affiliate, basePath, installArg, itemResolution, demoUrl }: RegistryViewerProps) {
  const analytics = useAnalytics()

  // The synthesised globals.css belongs to the component being read, not to
  // the rows of a listing: a row shows a name, and style variables do not
  // travel with one anyway.
  const items = registryIndex.items
  const processedInitialItem = initialItem ? addGlobalsCssFile(initialItem) : null

  // Determine initial tab: 'code' if there's a file, 'files' otherwise
  const initialTab: MobileTab = processedInitialItem?.files?.[0] ? 'code' : 'files'

  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(processedInitialItem)
  const [selectedFile, setSelectedFile] = useState<RegistryFile | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>(initialTab)

  // The page ships file paths, not file contents: the server renders from the
  // committed catalog and never reaches a registry, which is what lets these
  // pages be prerendered. The source arrives here, from the aggregated
  // endpoint, and only for the item being read.
  // Starts where the server leaves it: an item whose files have no contents is
  // waiting for them, and the markup says so. Defaulting to idle made the
  // first paint claim the item had no files, before anything had looked.
  const [sourceState, setSourceState] = useState<SourceState>(() =>
    initialItem && !initialItem.files?.some((file) => file.content)
      ? { status: "loading" }
      : { status: "ready" }
  )

  // Bumped by "Try again": re-running the request below is the whole retry.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const name = initialItem?.name
    if (!name) {
      setSourceState({ status: "idle" })
      return
    }
    if (initialItem?.files?.some((file) => file.content)) {
      setSourceState({ status: "ready" })
      return
    }

    const controller = new AbortController()
    setSourceState({ status: "loading" })

    fetch(`/r/${handle}/${name}.json`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) return null
        if (!response.ok) {
          // The endpoint's own status describes the endpoint: it answers 502
          // both for an origin that refused and for one it could not reach.
          // Its body carries what the origin actually said, which is the part
          // worth repeating.
          const body = await response.json().catch(() => null)
          throw new Error(body?.error ?? `The request failed with ${response.status}.`)
        }
        return (await response.json()) as RegistryItem
      })
      .then((fetched) => {
        if (!fetched) {
          setSourceState({ status: "not-found" })
          return
        }

        const fetchedFiles = fetched.files ?? []
        const byPath = new Map(fetchedFiles.map((file) => [file.path, file.content]))

        // Reconciled from the item the server sent, never from what is on
        // screen: a component with cssVars carries a synthetic globals.css
        // that this viewer added, so "does it have files" gets two different
        // answers depending on which one is asked. Rebuilding from the
        // original and running it back through addGlobalsCssFile keeps the
        // synthetic file and the remote ones in the same list.
        //
        // Some registries list an item without declaring its files, and the
        // aggregated endpoint still resolves them: filling contents in by path
        // would drop every one of those.
        const declared = initialItem?.files ?? []
        const reconciled = declared.length
          ? declared.map((file) => ({
              ...file,
              content: file.content ?? byPath.get(file.path),
            }))
          : fetchedFiles

        const merged = initialItem
          ? addGlobalsCssFile({ ...initialItem, files: reconciled })
          : null
        const adopted = declared.length ? null : (merged?.files?.[0] ?? null)

        setSelectedItem((current) => (current && merged ? merged : current))
        setSelectedFile((current) => {
          if (adopted) return adopted
          if (!current) return current
          return { ...current, content: current.content ?? byPath.get(current.path) }
        })
        setSourceState({ status: "ready" })
      })
      .catch((error: Error) => {
        // An aborted request is this component moving on, not a failure.
        if (error.name === "AbortError") return
        // The origin registry is the one that failed, not this page. Say so
        // where the source would have been, and leave the rest readable.
        setSourceState({ status: "error", message: error.message })
      })

    return () => {
      controller.abort()
    }
  }, [handle, initialItem, attempt])

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

  // Only the item view offers files to select, and there the only item on
  // screen is the one already in state — the tree passes the row it drew,
  // which carries no more than a listing needs.
  const handleSelectFile = (_item: ViewerItem, file: ViewerFile) => {
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
          })
          // TODO: Show toast notification
        },
        (err) => {
          console.error("Failed to copy link:", err)
        }
      )
    }
  }

  // When the source is not coming, the place it would have filled says why,
  // and the probe's finding decides how: a refusal is said as a refusal, an
  // item no run has reached yet as not checked, and only the rest as gone.
  // Said there and only there: the panels around it stay readable, since
  // everything else on the page comes from the directory's own catalog.
  const unavailable: SourceUnavailableKind | null =
    sourceState.status === "error"
      ? "error"
      : sourceState.status === "not-found"
        ? itemResolution === "gated"
          ? "gated"
          : itemResolution === "unverified"
            ? "unverified"
            : "gone"
        : null

  const sourceUnavailable = unavailable ? (
    <SourceUnavailable
      kind={unavailable}
      registryName={registry.name}
      visitHref={
        affiliate
          ? affiliate.affiliate_url
          : addUtmParams(registry.url, unavailable === "gated" ? "item_license" : "item_unavailable")
      }
      sponsored={Boolean(affiliate)}
      itemLabel={initialItem?.title || initialItem?.name || ""}
      onVisit={() => analytics.trackRegistryVisit({ destination: "registry" })}
      categoryHref={`${basePath}/${currentCategory}`}
      categoryLabel={REGISTRY_TYPE_LABELS[currentCategory] || currentCategory}
      onRetry={() => setAttempt((n) => n + 1)}
      errorMessage={sourceState.status === "error" ? sourceState.message : undefined}
      // Without the source, the author's demo is often the one way left to
      // see the component, so it leads.
      actions={
        demoUrl && initialItem ? (
          <PreviewButton
            demoUrl={demoUrl}
            affiliate={affiliate}
            itemLabel={initialItem.title || initialItem.name}
            registryName={registry.name}
            // Beside the card's own filled action, always the second one.
            variant="outline"
          />
        ) : undefined
      }
    />
  ) : null

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <ViewerHeader registry={registry} currentCategory={currentCategory} selectedItemName={initialItem?.name} affiliate={affiliate} basePath={basePath} />

      {initialItem && installArg && (
        <ItemBar
          registryName={registry.name}
          name={initialItem.name}
          title={initialItem.title}
          description={initialItem.description}
          // An item its origin no longer serves cannot be installed;
          // offering the command would only hand over an error.
          installArg={unavailable === "gone" ? undefined : installArg}
          demoUrl={demoUrl}
          affiliate={affiliate}
        />
      )}

      {sourceState.status === "loading" && (
        <div
          role="status"
          className="px-3 py-2 border-b border-border bg-surface-elevated text-xs text-muted-foreground"
        >
          Loading the source for <span className="font-mono">{initialItem?.name}</span>…
        </div>
      )}

      {/* Mobile Tab Navigation - only visible on mobile */}
      <MobileTabNavigation
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        hasFile={!!selectedFile}
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
            basePath={basePath}
            sourceStatus={sourceState.status}
          />
        </div>
        <div className={cn("h-full", mobileTab !== 'code' && "hidden")}>
          {sourceUnavailable ?? (
            <CodeViewer
              file={selectedFile}
              selectedItem={selectedItem}
              sourceStatus={sourceState.status}
            />
          )}
        </div>
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
              basePath={basePath}
              sourceStatus={sourceState.status}
            />
          </Panel>

          <PanelResizeHandle className="w-px bg-border" />

          <Panel defaultSize={45} minSize={35} maxSize={55}>
            {sourceUnavailable ?? (
              <CodeViewer
                file={selectedFile}
                selectedItem={selectedItem}
                sourceStatus={sourceState.status}
              />
            )}
          </Panel>

          <PanelResizeHandle className="w-px bg-border" />

          <Panel defaultSize={30} minSize={20} maxSize={40}>
            <InfoPanel item={selectedItem} />
          </Panel>
        </PanelGroup>
      </div>

      <StatusBar
        totalItems={categorySize}
        selectedFile={selectedFile}
        onShare={handleShare}
      />
    </div>
  )
}
