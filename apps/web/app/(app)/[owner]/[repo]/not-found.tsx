import Link from "next/link"
import { Package } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-neutral-900 p-6">
            <Package className="h-12 w-12 text-neutral-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
            404
          </h1>
          <h2 className="text-xl font-semibold text-white">
            Registry Not Found
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            This registry either doesn't exist or doesn't expose a{" "}
            <code className="text-neutral-300 bg-neutral-900 px-1.5 py-0.5 rounded">
              /r/registry.json
            </code>{" "}
            file.
          </p>
        </div>

        <div className="pt-4">
          <Button
            asChild
            variant="default"
            size="sm"
          >
            <Link href="/">
              Back to Directory
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
