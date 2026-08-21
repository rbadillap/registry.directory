import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Metadata } from "next"
import { LabsHome } from "./labs-home"
import type { CollectionsFile, ShippedFile } from "./types"

// Design lab — never linked from the site, never indexed. It reads the two
// derived files from apps/web/data, the same committed source every other
// page reads. No network, so nothing here can hold the page open for
// revalidation.
export const metadata: Metadata = {
  title: "labs / collections",
  robots: { index: false, follow: false },
}

export const dynamic = "force-static"

const DATA_DIR = join(process.cwd(), "data")

async function readDataFile<T>(filename: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(join(DATA_DIR, filename), "utf8")) as T
  } catch {
    // A lab page is worth rendering empty; it is not worth failing a build.
    return null
  }
}

export default async function LabsHomePage() {
  const [collections, shipped] = await Promise.all([
    readDataFile<CollectionsFile>("collections.json"),
    readDataFile<ShippedFile>("shipped.json"),
  ])

  return <LabsHome data={collections} shipped={shipped} />
}
