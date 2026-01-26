"use client"

import { useEffect, useRef, RefObject } from "react"

export interface KeyboardShortcutHandlers {
  onCopy?: () => void
  onSearch?: () => void
  onEscape?: () => void
  onNavigateUp?: () => void
  onNavigateDown?: () => void
  onExpandCollapse?: (direction: "left" | "right") => void
  onEnter?: () => void
  onHelp?: () => void
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  searchInputRef?: RefObject<HTMLInputElement | null>
}

export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, searchInputRef } = options

  // Use ref to always have latest handlers without re-registering listener
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const modKey = isMac ? event.metaKey : event.ctrlKey
      const target = event.target as HTMLElement
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA"

      // Cmd/Ctrl+C - Copy code
      if (modKey && event.key === "c" && !isInputFocused) {
        const selection = window.getSelection()
        if (!selection || selection.toString().length === 0) {
          event.preventDefault()
          handlersRef.current.onCopy?.()
        }
      }

      // Cmd/Ctrl+F - Focus search
      if (modKey && event.key === "f") {
        event.preventDefault()
        if (searchInputRef?.current) {
          searchInputRef.current.focus()
          searchInputRef.current.select()
        }
        handlersRef.current.onSearch?.()
      }

      // Escape - Clear/deselect
      if (event.key === "Escape") {
        event.preventDefault()
        if (isInputFocused && searchInputRef?.current) {
          searchInputRef.current.blur()
          searchInputRef.current.value = ""
        }
        handlersRef.current.onEscape?.()
      }

      // Arrow keys for navigation (only when not in input)
      if (!isInputFocused) {
        if (event.key === "ArrowUp") {
          event.preventDefault()
          handlersRef.current.onNavigateUp?.()
        }

        if (event.key === "ArrowDown") {
          event.preventDefault()
          handlersRef.current.onNavigateDown?.()
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault()
          handlersRef.current.onExpandCollapse?.("left")
        }

        if (event.key === "ArrowRight") {
          event.preventDefault()
          handlersRef.current.onExpandCollapse?.("right")
        }

        if (event.key === "Enter") {
          event.preventDefault()
          handlersRef.current.onEnter?.()
        }

        // ? - Show help/shortcuts
        if (event.key === "?") {
          event.preventDefault()
          handlersRef.current.onHelp?.()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [enabled, searchInputRef])
}
