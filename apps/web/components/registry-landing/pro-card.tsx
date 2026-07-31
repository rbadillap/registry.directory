import { Check, X } from "lucide-react"
import { PRO_OFFERING_LABELS, type ProOfferings } from "@/lib/types"

interface ProCardProps {
  pro: ProOfferings
}

export function ProCard({ pro }: ProCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface/50">
      <div className="flex items-center border-b border-border px-4 py-2.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Pro
        </span>
      </div>
      <ul className="space-y-3 px-4 pb-4 pt-3.5">
        {PRO_OFFERING_LABELS.map(([key, label]) => {
          const offered = pro[key]
          return (
            <li
              key={key}
              className="flex items-center gap-2.5 text-[13px] leading-[18px]"
            >
              {offered ? (
                <Check
                  className="h-[15px] w-[15px] flex-shrink-0 text-emerald-500 dark:text-emerald-400"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              ) : (
                <X
                  className="h-[15px] w-[15px] flex-shrink-0 text-foreground-faint"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )}
              <span className={offered ? "text-foreground" : "text-muted-foreground"}>
                {label}
              </span>
              <span className="sr-only">{offered ? "offered" : "not offered"}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
