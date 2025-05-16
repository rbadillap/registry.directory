import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "registry.directory - a collection of shadcn/ui registries",
  description: "The place where shadcn/ui registries live. Discover, Preview, Copy, and Paste components.",
  
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "var(--background)" },
    { media: "(prefers-color-scheme: dark)", color: "var(--background)" },
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
