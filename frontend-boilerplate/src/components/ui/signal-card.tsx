import * as React from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Sparkline } from "@/components/ui/sparkline"

export interface SignalCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Rótulo curto do sinal (ex.: "Latência p95"). */
  label: string
  /** Valor principal JÁ FORMATADO (ex.: "R$ 2,61 bi", "62"). */
  value: React.ReactNode
  /** Ícone exibido antes do rótulo. */
  icon?: React.ReactNode
  /** Série para a mini-sparkline. */
  data: number[]
  /**
   * Variação relativa (fração, ex.: 0.042 = +4,2%). O sinal define a seta
   * (↑/↓); a cor (bom/ruim) deriva de `trendPolarity`. Omitido = sem trend.
   */
  trend?: number
  /** Direção considerada "boa" para a variação. Default: "up-good". */
  trendPolarity?: "up-good" | "up-bad"
  /** Mostra/esconde a mini-sparkline. Default: true. */
  showSparkline?: boolean
  /**
   * Cor do TRAÇO da sparkline como classe Tailwind `stroke-…`
   * (ex.: "stroke-chart-1"). O preenchimento da área é derivado trocando
   * `stroke-` por `fill-` (com opacidade). Vence quando presente.
   */
  accentClassName?: string
  /**
   * Cor do TRAÇO da sparkline como estilo inline (ex.: `{ stroke: "#40E0D0" }`)
   * — para cores CSS cruas fora do DS. Aplicado no `<svg>` (traço + área).
   */
  accentStyle?: React.CSSProperties
}

/** Default DS: traço chart-1 + área chart-1 translúcida. */
const DEFAULT_STROKE = "stroke-chart-1"
const DEFAULT_FILL = "fill-chart-1/15"

/** Deriva a classe de preenchimento (área) a partir da classe de traço. */
function deriveFillClass(strokeClass: string): string {
  const first = strokeClass.trim().split(/\s+/)[0] ?? ""
  if (first.startsWith("stroke-")) {
    return `${first.replace("stroke-", "fill-")}/15`
  }
  return DEFAULT_FILL
}

function SignalCard({
  label,
  value,
  icon,
  data,
  trend,
  trendPolarity = "up-good",
  showSparkline = true,
  accentClassName,
  accentStyle,
  className,
  ...props
}: SignalCardProps) {
  const hasTrend = trend !== undefined
  const up = (trend ?? 0) >= 0
  const good = trendPolarity === "up-bad" ? !up : up
  const TrendIcon = up ? ArrowUpRight : ArrowDownRight

  // Cor da sparkline: estilo inline (cor CSS crua) vence; senão classe
  // Tailwind `stroke-…` (DS) com fill derivado; senão default DS.
  const useStyle = Boolean(accentStyle?.stroke)
  const strokeClass = useStyle ? "" : accentClassName ?? DEFAULT_STROKE
  const fillClass = useStyle ? "" : deriveFillClass(accentClassName ?? DEFAULT_STROKE)
  // Para cor CSS crua: pinta traço (polyline herda stroke) + área (polygon
  // herda fill com opacidade). A polyline tem fill="none" próprio, então só o
  // traço é colorido nela; o polygon (sem fill próprio) pega o fill herdado.
  const svgStyle: React.CSSProperties | undefined = useStyle
    ? { stroke: accentStyle!.stroke, fill: accentStyle!.stroke, fillOpacity: 0.15 }
    : undefined

  return (
    <div
      data-slot="signal-card"
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-3",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {icon ? <span className="flex items-center text-foreground">{icon}</span> : null}
          {label}
        </span>
        {hasTrend ? (
          <span
            className={cn(
              "flex items-center gap-0.5 tabular-nums",
              good ? "text-emerald-500" : "text-rose-500",
            )}
          >
            <TrendIcon className="size-3" />
            {(Math.abs(trend ?? 0) * 100).toFixed(1)}%
          </span>
        ) : null}
      </div>
      <div className="text-xl font-semibold tabular-nums text-foreground">
        {value}
      </div>
      {showSparkline ? (
        <Sparkline
          data={data}
          stroke={strokeClass}
          fill={fillClass}
          style={svgStyle}
          className="h-10"
        />
      ) : null}
    </div>
  )
}

export { SignalCard }
