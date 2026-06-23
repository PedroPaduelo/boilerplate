/**
 * BarChart — gráfico de barras VERTICAIS minimalista, com TOOLTIP no hover.
 *
 * Cada coluna é um trilho `relative flex-1` (altura resolvida pelo flex) e a
 * barra é `absolute bottom-0` com `height: <pct>%` — assim a altura percentual
 * tem um containing block com altura definida. O root usa `items-stretch` para
 * as colunas esticarem à altura total (senão colapsam e a barra some).
 *
 * Hover: ao passar o mouse numa coluna, ela destaca e mostra um tooltip-card
 * com o rótulo + valor formatado (`valueFormatter`).
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
  /** Classe Tailwind de cor de preenchimento das barras. Default: "bg-primary".
   *  IGNORADO se `style` for passado. */
  accent?: string
  /** Estilo inline aplicado à barra. Use para cores CSS custom (hex/rgb/hsl/
   *  gradient) que NÃO existem no enum do DS. VENCE `accent` quando setado. */
  style?: React.CSSProperties
  /** Formata o valor exibido no topo da barra + tooltip. Sem ele, oculta o valor. */
  valueFormatter?: (value: number) => string
  /** Mostra o valor no topo de cada barra (requer `valueFormatter`). Default: true. */
  showValues?: boolean
}

function BarChart({
  series,
  accent = "bg-primary",
  style: barStyle,
  valueFormatter,
  showValues = true,
  className,
  ...props
}: BarChartProps) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const max = Math.max(...series.map((s) => s.value), 1)
  return (
    <div
      data-slot="bar-chart"
      className={cn("relative flex h-56 items-stretch gap-1.5", className)}
      onMouseLeave={() => setHoverIdx(null)}
      {...props}
    >
      {series.map((s, i) => {
        const pct = Math.max((s.value / max) * 100, s.value > 0 ? 2 : 0)
        const formatted = valueFormatter ? valueFormatter(s.value) : undefined
        const active = hoverIdx === i
        return (
          <div
            key={`${s.label}-${i}`}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            onMouseEnter={() => setHoverIdx(i)}
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
                  "absolute bottom-0 w-full rounded-t-md transition-[height,opacity] duration-500",
                  // Se `barStyle` foi passado (cor CSS custom), NÃO aplica a
                  // classe `accent` (que vira `bg-#40E0D0` etc., inválida).
                  barStyle ? '' : accent,
                  active ? "opacity-100" : "opacity-85",
                )}
                style={{ height: `${pct}%`, ...barStyle }}
              />
              {/* Tooltip-card no hover */}
              {active && formatted ? (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-xs shadow-md">
                  <div className="font-medium text-popover-foreground">{s.label}</div>
                  <div className="tabular-nums text-muted-foreground">{formatted}</div>
                </div>
              ) : null}
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
