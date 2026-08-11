import type { Metadata } from "next"
import { LabsHome } from "./labs-home"
import { COLLECTIONS } from "./collections-data"

// Design lab — never linked from the site, never indexed.
export const metadata: Metadata = {
  title: "labs / collections",
  robots: { index: false, follow: false },
}

export const dynamic = "force-static"

export default function LabsHomePage() {
  return <LabsHome collections={COLLECTIONS} />
}
