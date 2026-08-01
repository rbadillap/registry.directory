import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"
import { FeedbackWidget } from "@/components/feedback-widget"

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://registry.directory"),
  title: {
    template: "%s | registry.directory",
    default: "registry.directory - The explorer for shadcn/ui registries",
  },
  description: "Browse, preview, and install from any shadcn/ui registry. Explore components in an IDE viewer, then copy the install command.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#262626" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${schibsted.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <FeedbackWidget />
        <Analytics />
      </body>
    </html>
  );
}
