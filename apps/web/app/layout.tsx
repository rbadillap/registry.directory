import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
        className={`${dmSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
