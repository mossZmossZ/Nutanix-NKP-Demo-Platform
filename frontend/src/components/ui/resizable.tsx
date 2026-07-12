import * as React from "react"
import * as ResizablePrimitive from "react-resizable-panels"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
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
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle>) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2",
        "data-[resize-handle-state=hover]:bg-primary data-[resize-handle-state=drag]:bg-primary",
        className,
      )}
      {...props}
    >
      <div className="z-10 flex h-8 w-3.5 items-center justify-center rounded-sm border border-border bg-surface">
        <GripVertical className="size-3 text-muted-foreground" />
      </div>
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
