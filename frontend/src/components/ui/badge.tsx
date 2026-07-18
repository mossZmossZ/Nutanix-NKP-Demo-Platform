import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// design.md §4 Badges / status pills — radius `full`, `label` type. `neutral`
// uses the violet accent tint; status variants use their color @12% background
// with the solid color as text (functional state only — never decoration).
const badgeVariants = cva(
  "inline-flex items-center gap-xxs rounded-sm px-xs py-xxs text-label tabular-nums",
  {
    variants: {
      variant: {
        neutral: "bg-accent text-accent-foreground",
        success: "bg-success/12 text-success",
        warning: "bg-warning/12 text-warning",
        danger: "bg-danger/12 text-danger",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
}

export { Badge, badgeVariants }
