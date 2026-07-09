import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Variants map directly to DESIGN.md `components:` button grammar.
// Only the two pill CTAs are implemented for the Phase 0 proof-of-theme;
// add more (button-dark-utility, button-pearl-capsule, ...) as real pages need them.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-pill px-[22px] py-[11px] font-text text-body transition-transform outline-none select-none active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary-focus",
  {
    variants: {
      variant: {
        // DESIGN.md component.button-primary
        primary: "bg-primary text-on-primary hover:opacity-90",
        // DESIGN.md component.button-secondary-pill
        secondary:
          "border border-primary bg-transparent text-primary hover:bg-primary/5",
        // Dark-surface counterpart: Action Blue "disappears" on dark tiles per
        // DESIGN.md, so this uses Sky Link Blue (primary-on-dark) instead.
        "secondary-dark":
          "border border-on-dark/20 bg-transparent text-primary-on-dark hover:bg-on-dark/5",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

function Button({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
