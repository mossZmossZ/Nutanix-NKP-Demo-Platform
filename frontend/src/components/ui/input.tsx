import { cn } from "@/lib/utils"

// design.md §4 Inputs — `surface` fill, 1px `border`, radius `md`; hover darkens
// the border one step; focus = 1px `primary` border + 3px ring@12%; error via
// `aria-invalid` = `danger` border + ring; disabled = muted @40%.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-surface px-sm py-xs text-body text-foreground",
        "placeholder:text-muted-foreground",
        "outline-none transition-[color,border-color,box-shadow] duration-[var(--duration-fast)] ease-standard",
        "hover:border-ink-500/40",
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12",
        "disabled:pointer-events-none disabled:opacity-40",
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/12",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
