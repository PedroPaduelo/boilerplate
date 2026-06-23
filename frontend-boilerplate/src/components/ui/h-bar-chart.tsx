import * as React from "react"

import { cn } from "@/shared/lib/utils"

/** Um ponto da série: rótulo + valor numérico. */
export interface HBarChartDatum {
  label: string
  value: number
}

export interface HBarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Série de barras (rótulo + valor). O maior valor define a barra cheia (100%). */
  series: HBarChartDatum[]
}

function HBarChart({ series, className, ...props }: HBarChartProps) {
  const max = Math.max(...series.map((s) => s.value), 1)
  return (
    <div data-slot="h-bar-chart" className={cn("flex flex-col gap-3", className)} {...props}>
      {series.map((s) => {
        const pct = (s.value / max) * 100
        return (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">
              {s.label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-medium text-foreground">
              {s.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export { HBarChart }
