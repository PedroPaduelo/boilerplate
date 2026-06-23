import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface ChartWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  chartType?: string
  query?: string
  durationMs?: number
  loading?: boolean
  actions?: React.ReactNode
  children?: React.ReactNode
}

function ChartWidget({
  title,
  chartType,
  query,
  durationMs,
  loading = false,
  actions,
  children,
  className,
  ...props
}: ChartWidgetProps) {
  return (
    <div
      data-slot="chart-widget"
      className={cn(
        "rounded-xl border border-border bg-card text-foreground",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium leading-none">{title}</h3>
          {chartType ? (
            <Badge variant="secondary" className="text-xs capitalize">
              {chartType}
            </Badge>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-1">{actions}</div>
        ) : null}
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          children
        )}
      </div>

      {/* Footer (optional) */}
      {query ? (
        <div className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <code
            className="max-w-md truncate font-mono"
            title={query}
          >
            {query}
          </code>
          {durationMs != null ? (
            <span className="shrink-0 tabular-nums">
              · {durationMs}ms
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export { ChartWidget, type ChartWidgetProps }
