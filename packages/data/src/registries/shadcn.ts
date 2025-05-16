import type { Registry } from "shadcn/registry";

export const registry: Registry = {
  name: "shadcn/ui",
  homepage: "https://ui.shadcn.com",
  items: [
    {
      name: "button",
      description: "A button component that follows the Radix UI button primitive.",
      type: "registry:component",
      categories: ["ui", "interactive", "form"],
      author: "shadcn https://twitter.com/shadcn",
      dependencies: ["@radix-ui/react-slot"],
      files: [
        {
          path: "registry/new-york/hello-world/page.tsx",
          type: "registry:page",
          target: "app/hello/page.tsx"
        },
      ],
    },
    {
      name: "card",
      description: "A card component with header, content, and footer sections.",
      type: "registry:component",
      categories: ["ui", "layout"],
      author: "shadcn https://twitter.com/shadcn",
    },
  ],
};
