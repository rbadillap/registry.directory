import Link from "next/link"

export function PageHeader() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 mb-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium">
          Registry Generator
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Generate a <Link href="https://ui.shadcn.com/docs/registry/introduction" target="_blank" className="text-xs text-neutral-300 leading-relaxed font-mono truncate hover:underline">shadcn/ui registry.json</Link> from your component files automatically. 
          Upload your components and we&apos;ll create the registry configuration for you.
        </p>
      </div>
    </div>
  )
}
