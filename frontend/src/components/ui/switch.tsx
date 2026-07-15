import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-ink-900/12 outline-none transition-colors duration-[var(--duration-fast)] ease-standard",
        "focus-visible:ring-[3px] focus-visible:ring-primary/12",
        "disabled:pointer-events-none disabled:opacity-40",
        "data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-[18px] rounded-full bg-surface shadow-sm ring-0 transition-transform duration-[var(--duration-fast)] ease-standard",
          "data-[state=checked]:translate-x-[18px]",
          "data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
