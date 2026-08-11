// Snapshot data for the /labs/home prototype. Generated from a live census
// of the corpus (67/74 registry indexes, 24,827 items, census 2026-08-11) by
// scratchpad/census/generate-collections.mjs. Real names, real numbers —
// nothing here is fetched at runtime. Regenerate rather than hand-edit.

export type LabRegistryCard = {
  name: string
  /** route path, e.g. "/aceternity" or "/owner/repo" */
  href: string
  description: string
  itemCount?: number
  /** dominant item types, humanized, max 2 */
  types?: string[]
  stars?: number
  /** offering chips when commercial */
  pro?: string[]
  /** relative last-commit, precomputed at snapshot time */
  updated?: string
  /** one-line evidence for membership in this collection */
  evidence?: string
}

export type LabCollection = {
  slug: string
  /** editorial title — the voice */
  title: string
  /** one-sentence standfirst under the title */
  standfirst: string
  /** machine-legible selection criterion — the signature element */
  criterion: string
  kind: "computed" | "curated"
  registries: LabRegistryCard[]
}

/** Provenance for the page header: name the date, the formula's substrate. */
export const CENSUS_META = {
  date: "2026-08-11",
  indexesOk: 67,
  indexesTotal: 74,
  totalItems: 24827,
}

export const COLLECTIONS: LabCollection[] =
[
  {
    "slug": "motion",
    "title": "Movement as a first language",
    "standfirst": "Registries where animation is the point, not the garnish — springs, staggers and scroll choreography ship inside the components.",
    "criterion": "deps ∩ { motion, framer-motion, gsap } · ranked by mentions",
    "kind": "computed",
    "registries": [
      {
        "name": "pqoqubbw/icons",
        "href": "/pqoqubbw/icons",
        "description": "An open-source (MIT License) collection of smooth animated icons for your projects. Built with motion and lucide",
        "itemCount": 466,
        "types": [
          "ui"
        ],
        "stars": 7919,
        "updated": "updated 3d ago",
        "evidence": "motion×466"
      },
      {
        "name": "Animate UI",
        "href": "/imskyleen/animate-ui",
        "description": "Fully animated, open-source component distribution built with React, TypeScript, Tailwind CSS, Motion, and Shadcn CLI.",
        "itemCount": 580,
        "types": [
          "ui",
          "hooks"
        ],
        "stars": 4142,
        "updated": "updated 7mo ago",
        "evidence": "motion×366"
      },
      {
        "name": "heroicons-animated",
        "href": "/Aniket-508/heroicons-animated",
        "description": "An open-source collection of 316 beautifully animated heroicons for your projects.",
        "itemCount": 316,
        "types": [
          "ui"
        ],
        "stars": 161,
        "updated": "updated 3d ago",
        "evidence": "motion×316"
      },
      {
        "name": "Shadcn Space",
        "href": "/shadcnspace/shadcnspace",
        "description": "A curated collection of beautiful shadcn/ui components, templates, and resources. Discover, copy, and ship modern UI faster.",
        "itemCount": 819,
        "types": [
          "blocks",
          "components"
        ],
        "stars": 724,
        "updated": "updated 6d ago",
        "evidence": "motion×310"
      },
      {
        "name": "UI TripleD",
        "href": "/moumen-soliman/uitripled",
        "description": "Production-ready UI components, motion blocks, and landing page templates powered by shadcn/ui and Framer Motion.",
        "itemCount": 282,
        "types": [
          "components",
          "blocks"
        ],
        "stars": 1307,
        "updated": "updated 20d ago",
        "evidence": "framer-motion×282"
      },
      {
        "name": "React Bits",
        "href": "/DavidHDev/react-bits",
        "description": "An open source collection of animated, interactive & fully customizable React components for building memorable websites.",
        "itemCount": 660,
        "types": [
          "components"
        ],
        "stars": 45285,
        "updated": "updated 3d ago",
        "pro": [
          "pro blocks",
          "templates",
          "mcp"
        ],
        "evidence": "gsap×142 · motion×80"
      },
      {
        "name": "Aceternity UI",
        "href": "/aceternity",
        "description": "Professional Next.js, Tailwind CSS and Framer Motion components.",
        "itemCount": 276,
        "types": [
          "blocks",
          "ui"
        ],
        "pro": [
          "pro blocks",
          "templates",
          "mcp",
          "team"
        ],
        "evidence": "motion×166 · framer-motion×1"
      }
    ]
  },
  {
    "slug": "agent-ui",
    "title": "Interfaces for agents",
    "standfirst": "Chat surfaces, streaming markdown, tool-call rendering — the component layer of the AI application stack. The dependency census can't see this cluster: chat UI rarely imports the AI SDK. Its identity lives in what the registries say they are.",
    "criterion": "name ∨ description ∋ { ai, agent, assistant } · from submission data",
    "kind": "computed",
    "registries": [
      {
        "name": "assistant-ui",
        "href": "/assistant-ui/assistant-ui",
        "description": "Radix-style React primitives for AI chat with adapters for AI SDK, LangGraph, Mastra, and custom backends.",
        "itemCount": 139,
        "types": [
          "components",
          "pages"
        ],
        "stars": 11543,
        "updated": "updated today",
        "evidence": "\"assistant\" in name"
      },
      {
        "name": "AI Canvas",
        "href": "/uiNerd16/aicanvas",
        "description": "Open-source animated React and Tailwind components, blocks, and design systems, installable via the shadcn CLI.",
        "itemCount": 125,
        "types": [
          "ui",
          "blocks"
        ],
        "stars": 46,
        "updated": "updated 2d ago",
        "evidence": "\"ai\" in name"
      },
      {
        "name": "AI Elements",
        "href": "/vercel/ai",
        "description": "A component library to help you build AI-native applications faster. It provides pre-built components like conversations, messages and more.",
        "itemCount": 77,
        "types": [
          "blocks",
          "components"
        ],
        "stars": 26121,
        "updated": "updated today",
        "evidence": "\"ai\" in name"
      },
      {
        "name": "21st.dev Agent Elements",
        "href": "/21st-dev/agent-elements",
        "description": "Open-source registry of agent UI primitives — chat shell, tool-call cards (Bash, Edit, Search, Todo, Plan), clarifying questions, input bar, streaming markdown. Built on React 19, Tailwind v4, and the Vercel AI SDK.",
        "itemCount": 25,
        "types": [
          "ui"
        ],
        "stars": 90,
        "updated": "updated 3mo ago",
        "evidence": "\"agent\" in name"
      },
      {
        "name": "@agents-ui",
        "href": "/livekit/components-js",
        "description": "LiveKit components for building voice and video AI agent interfaces: control bars, audio visualizers, track toggles, and session blocks.",
        "itemCount": 17,
        "types": [
          "components",
          "pages"
        ],
        "stars": 458,
        "updated": "updated today",
        "evidence": "\"agents\" in name"
      },
      {
        "name": "shadcn/studio",
        "href": "/shadcnstudio/shadcn-studio",
        "description": "Accelerate your project development with ready-to-use, and fully customizable shadcn ui Components, Blocks, UI Kits, Boilerplates, Templates and Themes with AI Tools",
        "itemCount": 694,
        "types": [
          "components",
          "blocks"
        ],
        "stars": 1762,
        "updated": "updated 5mo ago",
        "pro": [
          "pro blocks",
          "templates",
          "figma",
          "mcp",
          "team"
        ],
        "evidence": "\"ai\" in description"
      },
      {
        "name": "Coss UI",
        "href": "/cosscom/coss",
        "description": "A new, modern UI component library built on top of Base UI. Built for developers and AI.",
        "itemCount": 568,
        "types": [
          "blocks",
          "ui"
        ],
        "stars": 10405,
        "updated": "updated 7d ago",
        "evidence": "\"ai\" in description"
      }
    ]
  },
  {
    "slug": "dashboards",
    "title": "Built for dashboards",
    "standfirst": "Charts, data tables and the plumbing around them — registries that assume your next screen has numbers on it.",
    "criterion": "deps ∩ { recharts, tanstack-table, d3 } · ranked by mentions",
    "kind": "computed",
    "registries": [
      {
        "name": "ReUI",
        "href": "/keenthemes/reui",
        "description": "UI components and fully functional apps built with React, Next.js and Tailwind",
        "itemCount": 1607,
        "types": [
          "blocks",
          "ui"
        ],
        "stars": 3274,
        "updated": "updated 6d ago",
        "pro": [
          "pro blocks",
          "templates",
          "figma",
          "mcp"
        ],
        "evidence": "@tanstack/react-table×119 · recharts×71"
      },
      {
        "name": "shadcn-ui-blocks.com",
        "href": "/shadcn-ui-blocks",
        "description": "Shadcn blocks across standard collections and handcrafted premium collections, plus beautiful templates. Start free, then unlock more with Pro.",
        "itemCount": 4002,
        "types": [
          "blocks",
          "items"
        ],
        "pro": [
          "pro blocks",
          "templates",
          "mcp",
          "team"
        ],
        "evidence": "recharts×61"
      },
      {
        "name": "Shadcn Dashboard",
        "href": "/shadcndashboard/shadcndashboard",
        "description": "Build admin panels faster with the complete open source shadcn dashboard kit",
        "itemCount": 448,
        "types": [
          "components",
          "blocks"
        ],
        "stars": 229,
        "updated": "updated 10d ago",
        "evidence": "recharts×41 · @tanstack/react-table×13"
      },
      {
        "name": "Shadcn Space",
        "href": "/shadcnspace/shadcnspace",
        "description": "A curated collection of beautiful shadcn/ui components, templates, and resources. Discover, copy, and ship modern UI faster.",
        "itemCount": 819,
        "types": [
          "blocks",
          "components"
        ],
        "stars": 724,
        "updated": "updated 6d ago",
        "evidence": "@tanstack/react-table×15 · recharts×4"
      },
      {
        "name": "shadcn/studio",
        "href": "/shadcnstudio/shadcn-studio",
        "description": "Accelerate your project development with ready-to-use, and fully customizable shadcn ui Components, Blocks, UI Kits, Boilerplates, Templates and Themes with AI Tools",
        "itemCount": 694,
        "types": [
          "components",
          "blocks"
        ],
        "stars": 1762,
        "updated": "updated 5mo ago",
        "pro": [
          "pro blocks",
          "templates",
          "figma",
          "mcp",
          "team"
        ],
        "evidence": "@tanstack/react-table×15"
      },
      {
        "name": "UIAble",
        "href": "/codedthemes/uiable",
        "description": "An open-source shadcn-based UI system designed to help developers build scalable, production-ready applications faster.",
        "itemCount": 747,
        "types": [
          "ui",
          "blocks"
        ],
        "stars": 72,
        "updated": "updated 7d ago",
        "evidence": "recharts×10 · @tanstack/react-table×4"
      }
    ]
  },
  {
    "slug": "beyond-radix",
    "title": "Beyond Radix",
    "standfirst": "The ecosystem's default primitive is Radix. These registries bet on Base UI or React Aria instead — a real architectural fork.",
    "criterion": "deps ∩ { @base-ui/react, react-aria-components } · ranked by mentions",
    "kind": "computed",
    "registries": [
      {
        "name": "React Aria",
        "href": "/adobe/react-spectrum",
        "description": "Customizable Tailwind and Vanilla CSS components with adaptive interactions, top-tier accessibility, and internationalization.",
        "itemCount": 156,
        "types": [
          "ui",
          "styles"
        ],
        "stars": 15782,
        "updated": "updated today",
        "evidence": "react-aria-components×124 · react-aria×42"
      },
      {
        "name": "Intent UI",
        "href": "/intentui/intentui",
        "description": "Accessible React component library to copy, customize, and own your UI.",
        "itemCount": 570,
        "types": [
          "pages",
          "ui"
        ],
        "stars": 1947,
        "updated": "updated 2d ago",
        "evidence": "react-aria-components×145"
      },
      {
        "name": "RetroUI",
        "href": "/Logging-Studio/RetroUI",
        "description": "React based component library, inspired by neo-brutalism design system",
        "itemCount": 54,
        "types": [
          "ui"
        ],
        "stars": 1567,
        "updated": "updated 8d ago",
        "evidence": "@base-ui/react×54"
      },
      {
        "name": "ReUI",
        "href": "/keenthemes/reui",
        "description": "UI components and fully functional apps built with React, Next.js and Tailwind",
        "itemCount": 1607,
        "types": [
          "blocks",
          "ui"
        ],
        "stars": 3274,
        "updated": "updated 6d ago",
        "pro": [
          "pro blocks",
          "templates",
          "figma",
          "mcp"
        ],
        "evidence": "@base-ui/react×50"
      },
      {
        "name": "UIAble",
        "href": "/codedthemes/uiable",
        "description": "An open-source shadcn-based UI system designed to help developers build scalable, production-ready applications faster.",
        "itemCount": 747,
        "types": [
          "ui",
          "blocks"
        ],
        "stars": 72,
        "updated": "updated 7d ago",
        "evidence": "@base-ui/react×49"
      },
      {
        "name": "Coss UI",
        "href": "/cosscom/coss",
        "description": "A new, modern UI component library built on top of Base UI. Built for developers and AI.",
        "itemCount": 568,
        "types": [
          "blocks",
          "ui"
        ],
        "stars": 10405,
        "updated": "updated 7d ago",
        "evidence": "@base-ui/react×49"
      }
    ]
  },
  {
    "slug": "megacatalogs",
    "title": "The megacatalogs",
    "standfirst": "Four-digit item counts. When you need volume and variety more than a single voice.",
    "criterion": "items ≥ 1,000 · ranked by item count",
    "kind": "computed",
    "registries": [
      {
        "name": "shadcn-ui-blocks.com",
        "href": "/shadcn-ui-blocks",
        "description": "Shadcn blocks across standard collections and handcrafted premium collections, plus beautiful templates. Start free, then unlock more with Pro.",
        "itemCount": 4002,
        "types": [
          "blocks",
          "items"
        ],
        "pro": [
          "pro blocks",
          "templates",
          "mcp",
          "team"
        ],
        "evidence": "4,002 items · blocks"
      },
      {
        "name": "Shadcn Blocks",
        "href": "/shadcnblocks/shadcn-ui-blocks",
        "description": "A collection of premium blocks for Shadcn UI + Tailwind",
        "itemCount": 3968,
        "types": [
          "blocks",
          "components"
        ],
        "stars": 374,
        "updated": "updated 10mo ago",
        "pro": [
          "pro blocks",
          "templates",
          "figma",
          "mcp"
        ],
        "evidence": "3,968 items · blocks"
      },
      {
        "name": "Beste UI",
        "href": "/beste-co/beste-ui",
        "description": "Production-ready UI blocks for landing pages, dashboards, and web apps.",
        "itemCount": 1890,
        "types": [
          "blocks"
        ],
        "stars": 25,
        "updated": "updated 4d ago",
        "pro": [
          "pro blocks",
          "mcp",
          "team"
        ],
        "evidence": "1,890 items · blocks"
      },
      {
        "name": "ReUI",
        "href": "/keenthemes/reui",
        "description": "UI components and fully functional apps built with React, Next.js and Tailwind",
        "itemCount": 1607,
        "types": [
          "blocks",
          "ui"
        ],
        "stars": 3274,
        "updated": "updated 6d ago",
        "pro": [
          "pro blocks",
          "templates",
          "figma",
          "mcp"
        ],
        "evidence": "1,607 items · blocks"
      }
    ]
  },
  {
    "slug": "sells-real",
    "title": "Sells something real",
    "standfirst": "Commercial registries whose paid tier we verified on the live site — templates, Figma kits, MCP servers, team licenses.",
    "criterion": "pro flags verified · from submission data + live-site audit",
    "kind": "computed",
    "registries": [
      {
        "name": "shadcn/studio",
        "href": "/shadcnstudio/shadcn-studio",
        "description": "Accelerate your project development with ready-to-use, and fully customizable shadcn ui Components, Blocks, UI Kits, Boilerplates, Templates and Themes with AI Tools",
        "itemCount": 694,
        "types": [
          "components",
          "blocks"
        ],
        "stars": 1762,
        "updated": "updated 5mo ago",
        "pro": [
          "pro blocks",
          "templates",
          "figma",
          "mcp",
          "team"
        ]
      },
      {
        "name": "ShadcnCraft",
        "href": "/shadcncraft",
        "description": "A starter collection of polished shadcn/ui components and blocks built to production standards. Part of a larger Figma + React system designed to scale with your product.",
        "itemCount": 26,
        "types": [
          "ui",
          "blocks"
        ],
        "pro": [
          "pro blocks",
          "templates",
          "figma",
          "mcp",
          "team"
        ]
      },
      {
        "name": "shadcn-ui-blocks.com",
        "href": "/shadcn-ui-blocks",
        "description": "Shadcn blocks across standard collections and handcrafted premium collections, plus beautiful templates. Start free, then unlock more with Pro.",
        "itemCount": 4002,
        "types": [
          "blocks",
          "items"
        ],
        "pro": [
          "pro blocks",
          "templates",
          "mcp",
          "team"
        ]
      },
      {
        "name": "Shadcn Blocks",
        "href": "/shadcnblocks/shadcn-ui-blocks",
        "description": "A collection of premium blocks for Shadcn UI + Tailwind",
        "itemCount": 3968,
        "types": [
          "blocks",
          "components"
        ],
        "stars": 374,
        "updated": "updated 10mo ago",
        "pro": [
          "pro blocks",
          "templates",
          "figma",
          "mcp"
        ]
      },
      {
        "name": "ReUI",
        "href": "/keenthemes/reui",
        "description": "UI components and fully functional apps built with React, Next.js and Tailwind",
        "itemCount": 1607,
        "types": [
          "blocks",
          "ui"
        ],
        "stars": 3274,
        "updated": "updated 6d ago",
        "pro": [
          "pro blocks",
          "templates",
          "figma",
          "mcp"
        ]
      },
      {
        "name": "Shadcn UI Kit",
        "href": "/shadcnuikit",
        "description": "Launch your projects faster with admin dashboards, website templates, components, blocks, and pre-built real-world examples.",
        "itemCount": 875,
        "types": [
          "components",
          "blocks"
        ],
        "pro": [
          "pro blocks",
          "templates",
          "mcp",
          "team"
        ]
      }
    ]
  },
  {
    "slug": "weird-wonderful",
    "title": "Weird & wonderful",
    "standfirst": "Hand-picked outliers that stretch what a registry can be. No query produced this shelf — an editor did.",
    "criterion": "curated by @rbadillap · no query",
    "kind": "curated",
    "registries": [
      {
        "name": "termcn",
        "href": "/shadcn-labs/termcn",
        "description": "Beautiful terminal UIs, made simple. Ready to use, customizable terminal UI components for React.",
        "itemCount": 342,
        "types": [
          "ui",
          "files"
        ],
        "stars": 1057,
        "updated": "updated 2d ago",
        "evidence": "TUI components — renders in the terminal, not the browser"
      },
      {
        "name": "8bitcn",
        "href": "/TheOrcDev/8bitcn-ui",
        "description": "A set of 8-bit styled components for shadcn/ui. Works with your favorite frameworks. Open Source. Open Code.",
        "itemCount": 121,
        "types": [
          "blocks",
          "components"
        ],
        "stars": 1986,
        "updated": "updated 3d ago",
        "evidence": "the whole design system is 8-bit"
      },
      {
        "name": "RetroUI",
        "href": "/Logging-Studio/RetroUI",
        "description": "React based component library, inspired by neo-brutalism design system",
        "itemCount": 54,
        "types": [
          "ui"
        ],
        "stars": 1567,
        "updated": "updated 8d ago",
        "evidence": "neobrutalism as a component library"
      },
      {
        "name": "pqoqubbw/icons",
        "href": "/pqoqubbw/icons",
        "description": "An open-source (MIT License) collection of smooth animated icons for your projects. Built with motion and lucide",
        "itemCount": 466,
        "types": [
          "ui"
        ],
        "stars": 7919,
        "updated": "updated 3d ago",
        "evidence": "icons that move — every glyph is choreographed"
      },
      {
        "name": "heroicons-animated",
        "href": "/Aniket-508/heroicons-animated",
        "description": "An open-source collection of 316 beautifully animated heroicons for your projects.",
        "itemCount": 316,
        "types": [
          "ui"
        ],
        "stars": 161,
        "updated": "updated 3d ago",
        "evidence": "heroicons, but alive"
      }
    ]
  }
]
