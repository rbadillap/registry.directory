import type { Metadata } from "next"
import { loadCollections, loadShipped } from "@/lib/registry-data"
import { LabsHome } from "./labs-home"

// Design lab — never linked from the site, never indexed. Both files come
// from the committed data layer, so nothing here touches the network and
// nothing holds the page open for revalidation.
export const metadata: Metadata = {
  title: "labs / collections",
  robots: { index: false, follow: false },
}

export const dynamic = "force-static"

export default async function LabsHomePage() {
  const [collections, shipped] = await Promise.all([
    loadCollections(),
    loadShipped(),
  ])

  return <LabsHome data={collections} shipped={shipped} />
}
