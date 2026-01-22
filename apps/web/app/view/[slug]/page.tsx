import { notFound } from "next/navigation"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { RegistryViewer } from "@/components/registry-viewer"
import { DirectoryEntry } from "@/lib/types"
import { createSlug } from "@/lib/utils"

async function getRegistry(slug: string) {
  const filePath = join(process.cwd(), "public/registries.json")
  const fileContents = await readFile(filePath, "utf8")
  const registries = JSON.parse(fileContents) as DirectoryEntry[]

  return registries.find((r) => createSlug(r.name) === slug) || null
}

export default async function ViewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const registry = await getRegistry(slug)

  if (!registry) {
    notFound()
  }

  return <RegistryViewer registry={registry} />
}
