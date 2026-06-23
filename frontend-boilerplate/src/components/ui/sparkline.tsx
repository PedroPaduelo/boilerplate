import * as React from "react"

import { cn } from "@/shared/lib/utils"

export interface SparklineProps
  extends Omit<React.SVGProps<SVGSVGElement>, "children" | "width" | "height"> {
  /** Série de valores. A escala vertical é normalizada ao min/max local. */
  data: number[]
  /** Classe Tailwind da cor da linha. Default: "stroke-primary". */
  stroke?: string
  /** Classe Tailwind do preenchimento da área. Default: "fill-primary/10". */
  fill?: string
  /** Espessura da linha. Default: 2. */
  strokeWidth?: number
  /** Largura do viewBox (sistema de coordenadas). Default: 240. */
  width?: number
  /** Altura do viewBox (sistema de coordenadas). Default: 56. */
  height?: number
}

function Sparkline({
  data,
  stroke = "stroke-primary",
  fill = "fill-primary/10",
  strokeWidth = 2,
  width = 240,
  height = 56,
  className,
  ...props
}: SparklineProps) {
  const w = width
  const h = height
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = Math.max(max - min, 1)
  const step = data.length > 1 ? w / (data.length - 1) : w
  const coords = data.map((p, i) => {
    const x = i * step
    const y = h - ((p - min) / span) * (h - 8) - 4
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const linePoints = coords.join(" ")
  const areaPoints = `0,${h} ${linePoints} ${w},${h}`
  return (
    <svg
      data-slot="sparkline"
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-14 w-full", className)}
      preserveAspectRatio="none"
      role="img"
      aria-label="Tendência"
      {...props}
    >
      <polygon points={areaPoints} className={cn(fill)} />
      <polyline
        points={linePoints}
        fill="none"
        className={cn(stroke)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { Sparkline }
