import type { FileSystemTree } from "@webcontainer/api"
import { createViteTemplate } from "./vite-template"
import type { RegistryItem } from "@/lib/registry-types"

interface PreviewBuildOptions {
  item: RegistryItem
  previewCode: string
}

export function buildPreviewFiles({
  item,
  previewCode,
}: PreviewBuildOptions): FileSystemTree {
  // Start with base Vite template
  const deps: Record<string, string> = {}

  // Add component dependencies
  item.dependencies?.forEach((dep) => {
    deps[dep] = "latest"
  })

  const files = createViteTemplate(deps)

  // Add component files to src/components/
  const componentsDir: FileSystemTree = {}

  item.files?.forEach((file) => {
    const fileName = file.path.split("/").pop() || file.path
    componentsDir[fileName] = {
      file: {
        contents: file.content || "",
      },
    }
  })

  // Ensure src directory exists and add components
  if (!files.src || !("directory" in files.src)) {
    files.src = { directory: {} }
  }

  const srcDir = files.src as { directory: FileSystemTree }
  srcDir.directory.components = {
    directory: componentsDir,
  }

  // Add the preview code as App.jsx
  srcDir.directory["App.jsx"] = {
    file: {
      contents: previewCode,
    },
  }

  return files
}

// Helper to create a simple preview if no custom preview code exists
export function createDefaultPreview(item: RegistryItem): string {
  const componentName = toPascalCase(item.name)
  const mainFile = item.files?.[0]?.path.split("/").pop()?.replace(/\.tsx?$/, "")

  return `
import { ${componentName} } from './components/${mainFile}';

export default function App() {
  return (
    <div className="p-8">
      <${componentName}>
        ${item.name}
      </${componentName}>
    </div>
  );
}
`.trim()
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}
