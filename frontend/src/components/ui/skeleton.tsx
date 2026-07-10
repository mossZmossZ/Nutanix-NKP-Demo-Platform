import { cn } from "@/lib/utils"

// design.md §7 — known-shape loading placeholder. Opacity pulse only (GPU-friendly
// per §6); the global `prefers-reduced-motion` reset in index.css freezes it to
// static automatically, so no per-component reduced-motion handling is needed.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-line-200/70", className)}
      {...props}
    />
  )
}

export { Skeleton }
