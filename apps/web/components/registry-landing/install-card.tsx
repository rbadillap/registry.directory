import { CopyButton } from "./copy-button"

interface InstallCardProps {
  // The install argument (namespaced ref, item name, or item URL); the
  // invariant prefix lives here so the card controls the two-line layout.
  installArg: string
  totalItems: number
}

export function InstallCard({ installArg, totalItems }: InstallCardProps) {
  // Copy uses the single-line form — safest to paste anywhere.
  const command = `npx shadcn@latest add ${installArg}`

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface/50">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Install
        </span>
        <CopyButton text={command} label="Copy install command" />
      </div>
      <div className="space-y-2 px-4 pb-4 pt-3.5 font-mono text-[13px] leading-5">
        {/* Two deliberate lines with shell continuation: the invariant prefix,
            then the item ref — no accidental mid-word wrapping at any width.
            $ and \ are terminal chrome, dimmed to near-invisible. */}
        <p aria-label={command} className="flex flex-col gap-[3px]">
          <span className="flex gap-2.5">
            <span
              className="select-none text-foreground-faint"
              aria-hidden="true"
            >
              $
            </span>
            <span className="whitespace-nowrap text-foreground">
              npx shadcn@latest add{" "}
              <span
                className="select-none text-foreground-faint"
                aria-hidden="true"
              >
                \
              </span>
            </span>
          </span>
          <span className="break-all pl-[18px] text-foreground">
            {installArg}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          # works for any of the {totalItems}{" "}
          {totalItems === 1 ? "item" : "items"} in this registry
        </p>
      </div>
    </div>
  )
}
