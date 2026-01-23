"use client"

import { useEffect, useRef } from "react"
import { FolderTree, Code2, Info } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useAnalytics } from "@/hooks/use-analytics"

export type MobileTab = 'files' | 'code' | 'info'

interface MobileTabNavigationProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  hasFile: boolean
}

const tabs = [
  { id: 'files' as const, label: 'Files', icon: FolderTree },
  { id: 'code' as const, label: 'Code', icon: Code2 },
  { id: 'info' as const, label: 'Info', icon: Info },
]

export function MobileTabNavigation({ activeTab, onTabChange, hasFile }: MobileTabNavigationProps) {
  const analytics = useAnalytics()
  const previousTabRef = useRef<MobileTab>(activeTab)

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
          const isDisabled = !hasFile && tab.id !== 'files'

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative",
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
