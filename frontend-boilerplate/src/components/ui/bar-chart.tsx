/**
 * BarChart — gráfico de barras VERTICAIS minimalista, feito só com divs.
 *
 * Cada barra tem altura proporcional ao maior valor da série (normalização
 * local), com a cor de preenchimento controlável via `accent` (classe
 * Tailwind, ex.: "bg-primary" / "bg-emerald-500"). A altura é aplicada por
 * `style` inline (nunca classe interpolada), garantindo qualquer percentual.
 *
 * Extraído da composição `saas-dashboard-pro`. Sem dependências novas, sem
 * estado — apenas deriva o máximo da série e desenha. O elemento raiz expõe
 * `data-slot="bar-chart"` e aceita className/props padrão de um <div>.
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
}

function BarChart({ series, accent = "bg-primary", className, ...props }: BarChartProps) {
  const max = Math.max(...series.map((s) => s.value), 1)
  return (
    <div
      data-slot="bar-chart"
      className={cn("flex h-40 items-end gap-1.5", className)}
      {...props}
    >
      {series.map((s) => {
        const pct = (s.value / max) * 100
        return (
          <div
            key={s.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <div className="flex w-full flex-1 items-end">
              <div
                className={cn("w-full rounded-t-md", accent)}
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
