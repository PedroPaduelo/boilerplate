import * as React from "react"
import { Group, Panel, Separator } from "react-resizable-panels"
import { cn } from "@/shared/lib/utils"

type ResizablePanelGroupProps = React.ComponentProps<typeof Group> & {
  direction?: "horizontal" | "vertical"
}

function ResizablePanelGroup({
  className,
  direction,
  orientation,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <Group
      data-slot="resizable-panel-group"
      orientation={orientation ?? direction ?? "horizontal"}
      className={cn(
        "flex h-full w-full data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const ResizablePanel = Panel

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & { withHandle?: boolean }) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-1 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:-translate-y-1/2 data-[orientation=vertical]:after:translate-x-0",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <svg
            width="6"
            height="10"
            viewBox="0 0 6 10"
            fill="none"
            className="h-2.5 w-1.5 text-muted-foreground"
          >
            <path d="M1 1L1 9M5 1L5 9" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizableHandle, ResizablePanel }
