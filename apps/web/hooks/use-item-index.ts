"use client"

import { useCallback, useRef, useState } from "react"
import type { IndexedItem } from "@/lib/items-index"

export type ItemIndexStatus = "idle" | "loading" | "ready" | "error"

/**
 * The cross-registry item index, fetched the first time it is needed.
 *
 * The index is tens of thousands of items. Carrying it inside the page
 * means everyone who opens the home downloads a catalogue they may never
 * search. It lives at /items.json — a file on the CDN — and this asks for
 * it once, when someone shows they are about to search.
 */
export function useItemIndex(): {
  items: IndexedItem[]
  status: ItemIndexStatus
  load: () => void
} {
  const [items, setItems] = useState<IndexedItem[]>([])
  const [status, setStatus] = useState<ItemIndexStatus>("idle")

  // Guards the request itself, not the render: a person can focus, blur and
  // focus again long before the response arrives, and one index is enough.
  const requested = useRef(false)

  const load = useCallback(() => {
    if (requested.current) return
    requested.current = true
    setStatus("loading")

    fetch("/items.json")
      .then((response) => {
        if (!response.ok) throw new Error(`items.json responded ${response.status}`)
        return response.json()
      })
      .then((data: { items?: IndexedItem[] }) => {
        setItems(data.items ?? [])
        setStatus("ready")
      })
      .catch(() => {
        // Lets the next focus try again rather than leaving the search
        // permanently empty on one bad response.
        requested.current = false
        setStatus("error")
      })
  }, [])

  return { items, status, load }
}
