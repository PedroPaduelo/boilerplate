import * as React from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Sparkline } from "@/components/ui/sparkline"

/** Status semântico de saúde (deriva a cor de acento quando `tone` é omitido). */
export type SignalCardStatus = "healthy" | "degraded" | "critical" | "neutral"

/** Tom de acento nomeado da sparkline. */
export type SignalCardTone =
  | "primary"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"

export interface SignalCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Rótulo curto do sinal (ex.: "Latência p95"). */
  label: string
  /** Valor principal já formatado (ex.: "62ms", "2.2k"). */
  value: React.ReactNode
  /** Unidade exibida ao lado do valor (ex.: "rps"). */
  unit?: string
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
  /** Status semântico — define a cor de acento quando `tone` é omitido. */
  status?: SignalCardStatus
  /** Tom de acento explícito (sobrepõe `status`). Default: "primary". */
  tone?: SignalCardTone
}

const TONE: Record<SignalCardTone, { stroke: string; fill: string; text: string }> = {
  primary: { stroke: "stroke-primary", fill: "fill-primary/10", text: "text-primary" },
  sky: { stroke: "stroke-sky-400", fill: "fill-sky-400/15", text: "text-sky-500" },
  emerald: { stroke: "stroke-emerald-500", fill: "fill-emerald-500/15", text: "text-emerald-500" },
  amber: { stroke: "stroke-amber-400", fill: "fill-amber-400/15", text: "text-amber-500" },
  rose: { stroke: "stroke-rose-500", fill: "fill-rose-500/15", text: "text-rose-500" },
  violet: { stroke: "stroke-violet-400", fill: "fill-violet-400/15", text: "text-violet-500" },
}

const STATUS_TONE: Record<SignalCardStatus, SignalCardTone> = {
  healthy: "emerald",
  degraded: "amber",
  critical: "rose",
  neutral: "primary",
}

function SignalCard({
  label,
  value,
  unit,
  icon,
  data,
  trend,
  trendPolarity = "up-good",
  status,
  tone,
  className,
  ...props
}: SignalCardProps) {
  const resolvedTone = tone ?? (status ? STATUS_TONE[status] : "primary")
  const palette = TONE[resolvedTone]
  const hasTrend = trend !== undefined
  const up = (trend ?? 0) >= 0
  const good = trendPolarity === "up-bad" ? !up : up
  const TrendIcon = up ? ArrowUpRight : ArrowDownRight
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
          {icon ? <span className={cn("flex items-center", palette.text)}>{icon}</span> : null}
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
        {unit ? (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
      <Sparkline data={data} stroke={palette.stroke} fill={palette.fill} className="h-10" />
    </div>
  )
}

export { SignalCard }
