import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-rose-700 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-rose-700 text-white hover:bg-rose-700/80",
        secondary:
          "border-stone-700/50 bg-stone-900 text-neutral-300 hover:bg-stone-800",
        destructive:
          "border-transparent bg-red-700 text-white hover:bg-red-700/80",
        outline: "border-stone-700/50 text-neutral-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
