import { CopyButton } from "./copy-button"

interface InstallCardProps {
  command: string
  totalItems: number
}

export function InstallCard({ command, totalItems }: InstallCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface/50">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Install
        </span>
        <CopyButton text={command} label="Copy install command" />
      </div>
      <div className="space-y-2 px-4 pb-4 pt-3.5 font-mono text-[13px] leading-5">
        <p className="flex gap-2.5">
          <span className="select-none text-foreground-faint" aria-hidden="true">
            $
          </span>
          <span className="break-all text-foreground">{command}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          # works for any of the {totalItems}{" "}
          {totalItems === 1 ? "item" : "items"} in this registry
        </p>
      </div>
    </div>
  )
}
