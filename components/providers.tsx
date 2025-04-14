import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Analytics />
    </ThemeProvider>
  );
}
