import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AnimatedNumber } from "@/components/ui/animated-number"

export interface KpiCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Rótulo/título da métrica (ex.: "MRR", "Clientes ativos"). */
  label: string
  /** Valor numérico exibido com AnimatedNumber. */
  value: number
  /** Prefixo antes do valor (ex.: "$"). */
  prefix?: string
  /** Sufixo após o valor (ex.: ".3%"). */
  suffix?: string
  /** Variação (em %) vs. período anterior. >= 0 = verde, < 0 = vermelho. */
  delta?: number
  /** Texto auxiliar ao lado do delta. Default: "vs. período anterior". */
  hint?: string
  /** Ícone opcional exibido no canto superior direito. */
  icon?: React.ComponentType<{ className?: string }>
  /** Força a direção da tendência. Default: derivado do sinal de `delta`. */
  trend?: "up" | "down"
}

function KpiCard({
  label,
  value,
  prefix,
  suffix,
  delta,
  hint = "vs. período anterior",
  icon: Icon,
  trend,
  className,
  ...props
}: KpiCardProps) {
  const positive = trend ? trend === "up" : (delta ?? 0) >= 0
  return (
    <div
      data-slot="kpi-card"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-1 text-3xl font-semibold tracking-tight text-foreground">
        {prefix ? <span>{prefix}</span> : null}
        <AnimatedNumber value={value} />
        {suffix ? (
          <span className="text-2xl text-muted-foreground">{suffix}</span>
        ) : null}
      </div>
      {delta !== undefined ? (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
              positive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}
          >
            {positive ? "+" : ""}
            {delta}%
          </span>
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export { KpiCard }
