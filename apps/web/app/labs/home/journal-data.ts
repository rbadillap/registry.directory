// The directory's log, novedades-first: what the registries shipped,
// detected by diffing each registry.json against the previous day's snapshot.
// SIMULATED in this prototype — we hold one snapshot (census 2026-08-11), so
// "shipped" lines take the last K items of each fresh registry's index as the
// day's additions (indexes usually append). Item names are real; the timing
// attribution is the simulated part. The directory's own events (census,
// health, admissions) interleave — every line emitted by the system that
// caused it.

export type JournalEntry = {
  date: string
  registry: string
  avatar: string | null
  added: string[]
}

export const JOURNAL: JournalEntry[] = [
  {
    "date": "2026-08-11",
    "registry": "AI Elements",
    "avatar": "https://github.com/vercel.png",
    "added": [
      "example-tool",
      "example-v0-clone",
      "example-web-preview",
      "example-workflow"
    ]
  },
  {
    "date": "2026-08-11",
    "registry": "Clerk",
    "avatar": "https://github.com/clerk.png",
    "added": [
      "nextjs-aio-multistep-onboarding",
      "nextjs-custom-flows-multistep-onboarding"
    ]
  },
  {
    "date": "2026-08-11",
    "registry": "React Aria",
    "avatar": "https://github.com/adobe.png",
    "added": [
      "hooks-togglebuttongroup",
      "hooks-toolbar",
      "hooks-tooltip"
    ]
  },
  {
    "date": "2026-08-11",
    "registry": "assistant-ui",
    "avatar": "https://github.com/assistant-ui.png",
    "added": [
      "composer-trigger-popover",
      "directive-text",
      "generative-ui-style",
      "generative-ui"
    ]
  },
  {
    "date": "2026-08-11",
    "registry": "evex",
    "avatar": "https://github.com/TommyBez.png",
    "added": [
      "x-hot-topic-digest"
    ]
  },
  {
    "date": "2026-08-11",
    "registry": "@agents-ui",
    "avatar": "https://github.com/livekit.png",
    "added": [
      "agent-audio-visualizer-aura",
      "nextjs-api-token-route",
      "agent-session-view-01",
      "all"
    ]
  },
  {
    "date": "2026-08-10",
    "registry": "shadcn/ui",
    "avatar": "https://github.com/shadcn.png",
    "added": [
      "font-heading-instrument-serif"
    ]
  },
  {
    "date": "2026-08-10",
    "registry": "useLayouts",
    "avatar": "https://github.com/iurvish.png",
    "added": [
      "bento-card",
      "magnified-bento",
      "empty-testimonial"
    ]
  },
  {
    "date": "2026-08-10",
    "registry": "Payload Components",
    "avatar": "https://github.com/Ducksss.png",
    "added": [
      "pricing-enterprise"
    ]
  },
  {
    "date": "2026-08-09",
    "registry": "Magic UI",
    "avatar": "https://github.com/magicuidesign.png",
    "added": [
      "kinetic-text-demo",
      "text-3d-flip-demo",
      "text-3d-flip-demo-2",
      "utils"
    ]
  },
  {
    "date": "2026-08-09",
    "registry": "beUI",
    "avatar": "https://github.com/starc007.png",
    "added": [
      "not-found-magnetic",
      "not-found-spotlight",
      "not-found-stacked",
      "not-found-terminal"
    ]
  }
]
