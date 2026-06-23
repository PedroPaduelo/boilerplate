import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AnimatedNumber } from "@/components/ui/animated-number"

export interface KpiCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Rótulo/título da métrica (ex.: "MRR", "Clientes ativos"). */
  label: string
  /** Valor numérico exibido com AnimatedNumber. */
  value: number
  /**
   * Valor JÁ FORMATADO (string). Quando presente, é renderizado ESTÁTICO no
   * lugar do AnimatedNumber — ideal para valores grandes/monetários onde o
   * efeito slot-machine fica ilegível (ex.: "R$ 2,61 bi"). `prefix`/`suffix`
   * são ignorados nesse caso (já embutidos no display).
   */
  displayValue?: string
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
  /**
   * Se subir é bom (default `true`). Quando `false`, inverte a cor do delta:
   * uma variação positiva passa a ser sinalizada como negativa.
   */
  higherIsBetter?: boolean
}

function KpiCard({
  label,
  value,
  displayValue,
  prefix,
  suffix,
  delta,
  hint = "vs. período anterior",
  icon: Icon,
  trend,
  higherIsBetter = true,
  className,
  ...props
}: KpiCardProps) {
  const positive = trend ? trend === "up" : (delta ?? 0) >= 0
  const good = positive === higherIsBetter
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
        {displayValue !== undefined ? (
          <span className="tabular-nums">{displayValue}</span>
        ) : (
          <>
            {prefix ? <span>{prefix}</span> : null}
            <AnimatedNumber value={value} />
            {suffix ? (
              <span className="text-2xl text-muted-foreground">{suffix}</span>
            ) : null}
          </>
        )}
      </div>
      {delta !== undefined ? (
        <div className="flex items-center gap-1.5 text-xs">
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
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export { KpiCard }
