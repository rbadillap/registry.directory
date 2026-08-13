import type { Metadata } from "next"
import { WhatsNewGrid } from "./whats-new-grid"
import type { CollectionsFile, ShippedFile } from "../home/types"

// Design lab — never linked from the site, never indexed. The changelog wall
// reads shipped.json (what each registry added inside the rolling window) and
// collections.json (registry name → page on the site) from Vercel Blob, both
// produced by the local pipeline (pnpm ingest && pnpm generate).
export const metadata: Metadata = {
  title: "labs / what's new",
  robots: { index: false, follow: false },
}

export const dynamic = "force-static"

// Same pattern as lib/github-stats.ts: the public blob URL derives from the
// token's store id; reads are ISR-aligned with the daily pipeline cadence.
function blobBaseUrl(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const match = token?.match(/vercel_blob_rw_([^_]+)_/)
  return match ? `https://${match[1]}.public.blob.vercel-storage.com` : null
}

async function readBlobJson<T>(filename: string): Promise<T | null> {
  const base = blobBaseUrl()
  if (!base) return null
  try {
    const response = await fetch(`${base}/${filename}`, {
      next: { revalidate: 86400 },
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

export default async function LabsWhatsNewPage() {
  const [collections, shipped] = await Promise.all([
    readBlobJson<CollectionsFile>("collections.json"),
    readBlobJson<ShippedFile>("shipped.json"),
  ])

  return <WhatsNewGrid collections={collections} shipped={shipped} />
}
