import { Metadata } from "next";
import { DirectoryList, DirectoryEntry } from "@/components/directory-list";

export const metadata: Metadata = {
  title: "registry.directory - a collection of shadcn/ui registries",
  description:
    "The place where shadcn/ui registries live. Discover, Preview, Copy, and Paste components.",
  openGraph: {
    images: [
      {
        url: "/og",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "/og",
      },
    ],
  },
};

export default async function Home() {
  const entries: DirectoryEntry[] = [
    {
      name: "shadcn/ui",
      description: "The official registry for shadcn/ui components.",
      url: "https://ui.shadcn.com/",
    },
    {
      name: "Aceternity UI",
      description:
        "Professional Next.js, Tailwind CSS and Framer Motion components.",
      url: "https://ui.aceternity.com/",
    },
    {
      name: "Tweakcn",
      description: "A powerful Theme Editor for shadcn/ui.",
      url: "https://tweakcn.com/",
    },
    {
      name: "Origin UI",
      description: "Beautiful UI components built with Tailwind CSS and React",
      url: "https://originui.com/",
    },
    {
      name: "ui.pub",
      description: "Perfect tools to build next-gen UI",
      url: "https://uipub.com?utm_source=registry.directory",
    },
    {
      name: "Shadcn UI Blocks",
      description: "Customized Shadcn UI Blocks & Components | Preview & Copy",
      url: "https://shadcnui-blocks.com/",
    },
    {
      name: "Shadcn Form Builder",
      description:
        "Create forms with Shadcn, react-hook-form and zod within minutes.",
      url: "https://shadcn-form.com/",
    },
    {
      name: "Shadcn Blocks",
      description: "A collection of premium blocks for Shadcn UI + Tailwind",
      url: "https://shadcnblocks.com",
    },
    {
      name: "StyleGlide",
      description: "Create your own design system",
      url: "https://www.styleglide.ai/",
    },
    {
      name: "Neobrutalism components",
      description:
        "A collection of neobrutalism-styled, shadcn/ui based components.",
      url: "https://neobrutalism.dev/",
    },
  ];
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-medium font-mono">
          registry<span className="text-muted-foreground">.directory</span>{" "}
          <span className="text-xs text-foreground rounded-md border bg-rose-700 px-1">
            beta
          </span>
        </h1>
      </div>

      <div className="text-sm mt-10 px-4 text-center font-mono">
        <span className="text-muted-foreground">discover, preview, copy </span>
        <span className="text-foreground">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="inline-flex size-4 text-muted-foreground"
          >
            <path
              d="M21.0001 12.4286L12.4287 21"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M19.2857 3L3 19.2857"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </span>
        <span className="ml-1 font-mono font-bold">shadcn/ui</span>
        <span className="text-muted-foreground"> registries</span>
      </div>

      <DirectoryList entries={entries} />
    </main>
  );
}
