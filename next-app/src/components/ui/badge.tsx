import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-radius-pill px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-brand/20 text-brand border border-brand/30",
        critical: "bg-critical/20 text-critical border border-critical/30",
        warning: "bg-warning/20 text-warning border border-warning/30",
        stable: "bg-stable/20 text-stable border border-stable/30",
        info: "bg-info/20 text-info border border-info/30",
        secondary: "bg-surface-2 text-text-2 border border-border",
        outline: "border border-border text-text-2",
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
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
