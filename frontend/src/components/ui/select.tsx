import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// design.md §4 Inputs + §3 Elevation. Trigger mirrors <Input> (surface fill, 1px
// border, radius md, hover darkens border, focus = primary border + 3px ring@12%,
// disabled muted@40%). Popover mirrors <DropdownMenuContent> (surface, border,
// radius md, single shadow, zoom+fade motion on the design tokens).
function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-10 w-full items-center justify-between gap-sm rounded-md border border-input bg-surface px-sm py-xs text-body text-foreground",
        "data-[placeholder]:text-muted-foreground [&>span]:truncate",
        "outline-none transition-[color,border-color,box-shadow] duration-[var(--duration-fast)] ease-standard",
        "hover:border-ink-500/40",
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12",
        "disabled:pointer-events-none disabled:opacity-40",
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/12",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          "relative z-50 max-h-[var(--radix-select-content-available-height)] min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-xs text-popover-foreground shadow",
          "origin-[var(--radix-select-content-transform-origin)] duration-[var(--duration-base)] ease-standard data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          position === "popper" &&
            "w-full min-w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(position === "popper" && "h-[var(--radix-select-trigger-height)]")}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-xs pl-sm pr-lg text-body-sm text-foreground outline-none",
        "transition-colors duration-[var(--duration-fast)] ease-standard",
        "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        className,
      )}
      {...props}
    >
      <span className="absolute right-sm flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem }
