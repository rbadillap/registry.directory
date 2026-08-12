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
  kind: "shipped" | "admitted" | "health" | "census"
  text: string
}

export const JOURNAL: JournalEntry[] = [
  {
    "date": "2026-08-11",
    "kind": "shipped",
    "text": "AI Elements +4 items — example-tool, example-v0-clone, example-web-preview, example-workflow"
  },
  {
    "date": "2026-08-11",
    "kind": "shipped",
    "text": "Clerk +2 items — nextjs-aio-multistep-onboarding, nextjs-custom-flows-multistep-onboarding"
  },
  {
    "date": "2026-08-11",
    "kind": "shipped",
    "text": "React Aria +3 items — hooks-togglebuttongroup, hooks-toolbar, hooks-tooltip"
  },
  {
    "date": "2026-08-11",
    "kind": "shipped",
    "text": "assistant-ui +4 items — composer-trigger-popover, directive-text, generative-ui-style, generative-ui"
  },
  {
    "date": "2026-08-11",
    "kind": "shipped",
    "text": "evex +1 item — x-hot-topic-digest"
  },
  {
    "date": "2026-08-11",
    "kind": "shipped",
    "text": "@agents-ui +4 items — agent-audio-visualizer-aura, nextjs-api-token-route, agent-session-view-01, all"
  },
  {
    "date": "2026-08-11",
    "kind": "census",
    "text": "census ran — 67 of 74 indexes answered, 24,827 items measured"
  },
  {
    "date": "2026-08-11",
    "kind": "health",
    "text": "jollyui.dev and shadcn-glass-ui stopped resolving (404)"
  },
  {
    "date": "2026-08-10",
    "kind": "shipped",
    "text": "shadcn/ui +1 item — font-heading-instrument-serif"
  },
  {
    "date": "2026-08-10",
    "kind": "shipped",
    "text": "useLayouts +3 items — bento-card, magnified-bento, empty-testimonial"
  },
  {
    "date": "2026-08-10",
    "kind": "shipped",
    "text": "Payload Components +1 item — pricing-enterprise"
  },
  {
    "date": "2026-08-09",
    "kind": "shipped",
    "text": "Magic UI +4 items — kinetic-text-demo, text-3d-flip-demo, text-3d-flip-demo-2, utils"
  },
  {
    "date": "2026-08-09",
    "kind": "shipped",
    "text": "beUI +4 items — not-found-magnetic, not-found-spotlight, not-found-stacked, not-found-terminal"
  },
  {
    "date": "2026-08-02",
    "kind": "admitted",
    "text": "Zyeon UI admitted — 353 items, handle @zyeon"
  }
]

export const JOURNAL_MARKS: Record<JournalEntry["kind"], string> = {
  shipped: "+",
  admitted: "◆",
  health: "!",
  census: "∑",
}
