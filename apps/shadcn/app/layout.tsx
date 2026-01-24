import type { Metadata } from "next"
import "@workspace/ui/globals.css"

export const metadata: Metadata = {
  title: "shadcn/ui Previews",
  description: "Live component previews for shadcn/ui",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
