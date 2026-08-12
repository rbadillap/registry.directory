// The directory's own log — real events, hand-authored for the prototype.
// In production every line is emitted by the system that caused it: the
// admission flow, the daily census, the submission inbox.

export type JournalEntry = {
  date: string
  kind: "admitted" | "health" | "submission" | "census"
  text: string
}

export const JOURNAL: JournalEntry[] = [
  {
    date: "2026-08-11",
    kind: "census",
    text: "census ran — 67 of 74 indexes answered, 24,827 items measured",
  },
  {
    date: "2026-08-11",
    kind: "health",
    text: "jollyui.dev and shadcn-glass-ui stopped resolving (404); shadcn-form.com refuses probes (403)",
  },
  {
    date: "2026-08-10",
    kind: "submission",
    text: "Motion Menu submitted — 596 motion/3D patterns, under review",
  },
  {
    date: "2026-08-05",
    kind: "submission",
    text: "OnSystem on hold — index resolves but every item is gated",
  },
  {
    date: "2026-08-02",
    kind: "admitted",
    text: "Zyeon UI admitted — 353 items, handle @zyeon",
  },
  {
    date: "2026-07-31",
    kind: "admitted",
    text: "nine registries admitted in one batch — ShadcnCraft, efferd, Beste UI, PaceUI, Shadcn UI Kit, shadcn-ui-blocks.com, beUI, Zippystarter, Turbopills UI",
  },
]

export const JOURNAL_MARKS: Record<JournalEntry["kind"], string> = {
  admitted: "+",
  health: "!",
  submission: "→",
  census: "∑",
}
