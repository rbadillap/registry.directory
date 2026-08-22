import Link from "next/link"
import { Compass } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"

// The recovery links double as the agent-facing map: a crawler that lands on
// a dead path leaves knowing where the site's real surfaces are.
export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Compass className="text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle className="text-foreground">Page Not Found</EmptyTitle>
          <EmptyDescription className="text-muted-foreground">
            This page does not exist. Registries live at{" "}
            <code className="text-foreground-secondary bg-secondary px-1.5 py-0.5 rounded">
              /{"{owner}"}/{"{repo}"}
            </code>
            ; the machine-readable surfaces are listed at{" "}
            <Link href="/docs" className="underline underline-offset-2">
              /docs
            </Link>{" "}
            and{" "}
            <a href="/llms.txt" className="underline underline-offset-2">
              /llms.txt
            </a>
            .
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex items-center gap-2">
            <Button asChild variant="default" size="sm">
              <Link href="/">Back to Directory</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/sitemap.xml">Sitemap</a>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
