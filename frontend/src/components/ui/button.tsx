import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Variants map to design.md §4 Buttons. "secondary-dark" is a caller-preserved
// extra (LandingPage hero on a dark tile) — not one of the four spec'd
// variants, kept only so existing callers don't break.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-[22px] py-[11px] text-button outline-none select-none transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--duration-fast)] ease-standard active:translate-y-px disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        // design.md §4 — Primary
        primary:
          "border border-transparent bg-primary text-primary-foreground hover:bg-iris-700 focus-visible:ring-primary/12",
        // design.md §4 — Secondary
        secondary:
          "border border-border bg-transparent text-foreground hover:bg-foreground/4 focus-visible:border-primary focus-visible:ring-primary/12",
        // design.md §4 — Ghost
        ghost:
          "border border-transparent bg-transparent text-blue-600 hover:bg-foreground/6 focus-visible:ring-primary/12",
        // design.md §4 — Destructive (confirm-delete only; never a primary path)
        destructive:
          "border border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/12",
        // Dark-surface counterpart for marketing hero tiles (not in design.md §4;
        // preserved so LandingPage's on-dark CTA keeps working).
        "secondary-dark":
          "border border-white/20 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white/20",
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
