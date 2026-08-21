import { fetchAllRegistryItems } from "@/lib/registry-items"
import { loadDirectory } from "@/lib/resolve-registry"

// The cross-registry item index, as a file.
//
// Prerendered at build time from the committed views and served from the
// CDN, so asking for it costs no function invocation and opens no ISR
// window. It changes when a deployment ships new views, never in between —
// which is why there is no revalidate here.
//
// The home fetches this the first time someone searches, instead of
// carrying all of it inside its own HTML.
export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  const items = await fetchAllRegistryItems(await loadDirectory())

  return new Response(JSON.stringify({ items }), {
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      // Published alongside directory.json and tools.json: readable by
      // anything that wants the catalog, browsers and agents alike.
      "Access-Control-Allow-Origin": "*",
    },
  })
}
