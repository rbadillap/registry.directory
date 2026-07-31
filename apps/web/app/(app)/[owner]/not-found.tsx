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
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package className="text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle className="text-foreground">Registry Not Found</EmptyTitle>
          <EmptyDescription className="text-muted-foreground">
            This registry either does not exist or does not expose a{" "}
            <code className="text-foreground-secondary bg-secondary px-1.5 py-0.5 rounded">
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
