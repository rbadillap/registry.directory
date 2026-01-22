import Link from "next/link"
import { Package } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-6">
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package className="text-neutral-500" />
          </EmptyMedia>
          <EmptyTitle className="text-white">Registry Not Found</EmptyTitle>
          <EmptyDescription className="text-neutral-400">
            This registry either doesn't exist or doesn't expose a{" "}
            <code className="text-neutral-300 bg-neutral-900 px-1.5 py-0.5 rounded">
              /r/registry.json
            </code>{" "}
            file.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="default" size="sm">
            <Link href="/">Back to Directory</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
