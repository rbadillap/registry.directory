"use client"

import { useEffect, useRef, useMemo } from "react"
import { FolderTree, Code2, Info, Eye } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useAnalytics } from "@/hooks/use-analytics"

export type MobileTab = 'files' | 'code' | 'preview' | 'info'

interface MobileTabNavigationProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  hasFile: boolean
  showPreview?: boolean
}

const baseTabs = [
  { id: 'files' as const, label: 'Files', icon: FolderTree, isNew: false },
  { id: 'code' as const, label: 'Code', icon: Code2, isNew: false },
  { id: 'preview' as const, label: 'Preview', icon: Eye, isNew: true },
  { id: 'info' as const, label: 'Info', icon: Info, isNew: false },
]

export function MobileTabNavigation({ activeTab, onTabChange, hasFile, showPreview = false }: MobileTabNavigationProps) {
  const analytics = useAnalytics()
  const previousTabRef = useRef<MobileTab>(activeTab)

  // Filter tabs based on showPreview prop
  const tabs = useMemo(() => {
    return baseTabs.filter((tab) => tab.id !== 'preview' || showPreview)
  }, [showPreview])

  // Track tab switches
  useEffect(() => {
    const previousTab = previousTabRef.current

    // Only track if the tab actually changed (not on initial mount)
    if (previousTab !== activeTab && previousTab !== undefined) {
      analytics.trackMobileTabSwitched({
        from_tab: previousTab,
        to_tab: activeTab,
        has_file_selected: hasFile,
      })
    }

    // Update the ref for next comparison
    previousTabRef.current = activeTab
  }, [activeTab, hasFile, analytics])

  return (
    <div className="md:hidden border-b border-neutral-800 bg-black">
      <div className="flex items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          // Disable code, preview, and info tabs when no file is selected (except files tab)
          const isDisabled = !hasFile && tab.id !== 'files'

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative",
                "min-h-[44px]", // Touch target size
                isActive
                  ? "text-white"
                  : isDisabled
                  ? "text-neutral-600 cursor-not-allowed"
                  : "text-neutral-400 hover:text-neutral-300 active:bg-neutral-800/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.isNew && (
                <span className="px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-rose-400 border border-rose-500/50 rounded bg-rose-500/10">
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
    </div>
  )
}
