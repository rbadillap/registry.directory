import type { Metadata } from "next"
import { LabsHome } from "./labs-home"
import type { CollectionsFile, ShippedFile } from "./types"

// Design lab — never linked from the site, never indexed. v0.4: the page
// reads collections.json and shipped.json from Vercel Blob, both produced
// by the local pipeline (pnpm ingest && pnpm generate). Nothing is baked in.
export const metadata: Metadata = {
  title: "labs / collections",
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

export default async function LabsHomePage() {
  const [collections, shipped] = await Promise.all([
    readBlobJson<CollectionsFile>("collections.json"),
    readBlobJson<ShippedFile>("shipped.json"),
  ])

  return <LabsHome data={collections} shipped={shipped} />
}
