// The way back from a search result to the search that found it.
//
// Opening a result used to cost the search: the viewer's back arrow walks the
// registry's own hierarchy, and the home, rebuilt on return, forgot how far
// down the list had been read and whether "Show more" was open. The results
// arrive after the page does, so the browser cannot restore the scroll on its
// own either.
//
// One entry, in sessionStorage: it belongs to this tab and this visit, and
// each result opened replaces it. Every access is guarded, because storage
// can be missing or refuse a write, and losing the way back must never break
// the page.

const KEY = "registry.directory:search-return"

export interface SearchReturn {
  // The home's query string for the search, as homeSearch() builds it.
  results: string
  // The path of the result that was opened.
  target: string
  // Whether the item list had been expanded past its first page.
  expanded: boolean
  scrollY: number
}

export function rememberSearch(entry: SearchReturn): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(entry))
  } catch {
    // No way back is the behaviour the site had before; nothing to report.
  }
}

export function readSearchReturn(): SearchReturn | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as Partial<SearchReturn>
    if (typeof entry.results !== "string" || typeof entry.target !== "string") {
      return null
    }
    return {
      results: entry.results,
      target: entry.target,
      expanded: entry.expanded === true,
      scrollY: typeof entry.scrollY === "number" ? entry.scrollY : 0,
    }
  } catch {
    return null
  }
}

// Once the home has been put back the way it was, the entry has done its job.
// Keeping it would scroll a later, unrelated visit to the same search.
export function forgetSearchReturn(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Same as above.
  }
}
