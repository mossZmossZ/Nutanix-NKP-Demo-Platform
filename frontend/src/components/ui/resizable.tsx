import * as React from "react"
import * as ResizablePrimitive from "react-resizable-panels"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

// react-resizable-panels@4 (pinned in Task 2) exports `Group` / `Panel` /
// `Separator` — not the `PanelGroup` / `PanelResizeHandle` names shadcn's
// upstream template (written against v2) uses. Wrapper internals target the
// installed v4 API; the public export names (`ResizablePanelGroup`,
// `ResizablePanel`, `ResizableHandle`) stay as-is since Task 9 consumes those.
// v4 takes `orientation` ("horizontal" | "vertical") instead of `direction`,
// and its group root has no `data-panel-group-direction` attribute, so the
// vertical layout is driven by an explicit prop check instead of a data-attr
// selector. Confirmed via `renderToStaticMarkup` against the installed
// package: root emits `data-group`, panels emit `data-panel`, and the
// separator emits `data-separator="inactive" | "hover" | "active"`.
function ResizablePanelGroup({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      orientation={orientation}
      className={cn("flex h-full w-full", orientation === "vertical" && "flex-col", className)}
      {...props}
    />
  )
}

function ResizablePanel(props: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator>) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2",
        "data-[separator=hover]:bg-primary data-[separator=active]:bg-primary",
        className,
      )}
      {...props}
    >
      <div className="z-10 flex h-8 w-3.5 items-center justify-center rounded-sm border border-border bg-surface">
        <GripVertical className="size-3 text-muted-foreground" />
      </div>
    </ResizablePrimitive.Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
