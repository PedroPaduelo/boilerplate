/**
 * BarChart — gráfico de barras VERTICAIS minimalista, feito só com divs.
 *
 * Cada barra tem altura proporcional ao maior valor da série (normalização
 * local). A coluna usa um trilho `relative flex-1` (altura resolvida pelo
 * flex) e a barra é `absolute bottom-0` com `height: <pct>%` — assim a altura
 * percentual tem um containing block com altura definida (corrige o bug em que
 * `height:%` colapsava para 0 dentro de um flex `items-end`).
 *
 * `valueFormatter` (opcional) formata o valor exibido no topo da barra e no
 * `title` (tooltip nativo). Sem ele, nenhum valor é mostrado.
 */

import * as React from "react"

import { cn } from "@/shared/lib/utils"

/** Um ponto da série: rótulo do eixo + valor numérico. */
export interface BarChartDatum {
  label: string
  value: number
}

export interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Série de barras (rótulo + valor). O maior valor define o topo (100%). */
  series: BarChartDatum[]
  /** Classe Tailwind de cor de preenchimento das barras. Default: "bg-primary". */
  accent?: string
  /** Formata o valor exibido no topo da barra + tooltip. Sem ele, oculta o valor. */
  valueFormatter?: (value: number) => string
  /** Mostra o valor no topo de cada barra (requer `valueFormatter`). Default: true. */
  showValues?: boolean
}

function BarChart({
  series,
  accent = "bg-primary",
  valueFormatter,
  showValues = true,
  className,
  ...props
}: BarChartProps) {
  const max = Math.max(...series.map((s) => s.value), 1)
  return (
    <div
      data-slot="bar-chart"
      className={cn("flex h-48 items-stretch gap-1.5", className)}
      {...props}
    >
      {series.map((s, i) => {
        const pct = Math.max((s.value / max) * 100, s.value > 0 ? 2 : 0)
        const formatted = valueFormatter ? valueFormatter(s.value) : undefined
        return (
          <div
            key={`${s.label}-${i}`}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            title={formatted ? `${s.label}: ${formatted}` : s.label}
          >
            {showValues && formatted ? (
              <span className="w-full truncate text-center text-[10px] font-medium tabular-nums text-foreground">
                {formatted}
              </span>
            ) : null}
            {/* trilho relative com altura resolvida pelo flex (flex-1) */}
            <div className="relative flex w-full flex-1 items-end">
              <div
                className={cn(
                  "absolute bottom-0 w-full rounded-t-md transition-[height] duration-500",
                  accent,
                )}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="w-full truncate text-center text-[10px] text-muted-foreground">
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export { BarChart }
