/**
 * Fetch utilities with proper identification for registry.directory.
 *
 * Exactly two callers remain, both of which resolve a single item
 * against its origin registry on demand: the /r item proxy and fetchItemData
 * in components/registry-slug-view.tsx. Registry *indexes* are never fetched
 * from the app any more — they are read from apps/web/data.
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; registry-directory/1.0; +https://registry.directory)'

interface FetchOptions extends RequestInit {
  timeout?: number
}

/**
 * Fetch with proper User-Agent and timeout handling
 */
export async function registryFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 5000, ...fetchOptions } = options

  // Setup abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        ...fetchOptions.headers,
      },
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Fetch and parse JSON with proper identification
 */
export async function registryFetchJson<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await registryFetch(url, options)

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
