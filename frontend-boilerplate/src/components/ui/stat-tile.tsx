import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AnimatedNumber } from "@/components/ui/animated-number"

export interface StatTileProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Rótulo/título da estatística (ex.: "Eventos hoje"). */
  label: string
  /** Valor numérico exibido com AnimatedNumber. */
  value: number
  /** Prefixo antes do valor (ex.: "$"). */
  prefix?: string
  /** Sufixo após o valor (ex.: " dias", "%"). */
  suffix?: string
  /** Ícone opcional exibido antes do rótulo. */
  icon?: React.ComponentType<{ className?: string }>
  /** Variação (em %) vs. período anterior. >= 0 = verde, < 0 = vermelho. */
  delta?: number
  /** Força a direção da tendência. Default: derivado do sinal de `delta`. */
  trend?: "up" | "down"
  /**
   * Se subir é bom (default `true`). Quando `false`, inverte a cor do delta:
   * uma variação positiva passa a ser sinalizada como negativa.
   */
  higherIsBetter?: boolean
  /** Texto auxiliar exibido ao lado do delta (ex.: "vs. ontem"). */
  hint?: string
}

function StatTile({
  label,
  value,
  prefix,
  suffix,
  icon: Icon,
  delta,
  trend,
  higherIsBetter = true,
  hint,
  className,
  ...props
}: StatTileProps) {
  const positive = trend ? trend === "up" : (delta ?? 0) >= 0
  const good = positive === higherIsBetter
  return (
    <div
      data-slot="stat-tile"
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon ? (
          <span className="flex size-7 items-center justify-center rounded-md bg-muted">
            <Icon className="size-3.5" />
          </span>
        ) : null}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5 text-xl font-semibold tracking-tight text-foreground">
        {prefix ? <span>{prefix}</span> : null}
        <AnimatedNumber value={value} />
        {suffix ? (
          <span className="text-sm font-normal text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {delta !== undefined || hint ? (
        <div className="flex items-center gap-1.5 text-xs">
          {delta !== undefined ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
                good
                  ? "bg-chart-2/10 text-chart-2"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {positive ? "+" : ""}
              {delta}%
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export { StatTile }
