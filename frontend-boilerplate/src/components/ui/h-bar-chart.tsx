/**
 * HBarChart — gráfico de barras HORIZONTAIS minimalista, com TOOLTIP no hover
 * e efeito FOCUS/DIM.
 *
 * Cada linha tem: rótulo (esquerda) · trilho com a barra (`width: <pct>%`, o
 * maior valor = 100%) · valor formatado (direita). No hover, a linha sob o
 * mouse fica em DESTAQUE (opacidade cheia + leve sombra na barra) enquanto as
 * demais ESMAECEM (opacity ~0.35), com transição suave; um tooltip-card mostra
 * rótulo + valor formatado. Cada barra expõe `role="img"` + `aria-label`
 * (categoria + valor) para leitores de tela.
 *
 * O valor é formatado pelo `valueFormatter` injetado pelo bloco do catálogo
 * (mantém o componente UI agnóstico de moeda/locale). Sem ele, usa o número cru.
 */

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
  /** Classe Tailwind de cor de preenchimento das barras. Default: "bg-primary".
   *  IGNORADO se `style` for passado. */
  accent?: string
  /** Estilo inline aplicado à barra. Use para cores CSS custom (hex/rgb/hsl/
   *  gradient) que NÃO existem no enum do DS. VENCE `accent` quando setado. */
  style?: React.CSSProperties
  /** Formata o valor (rótulo lateral + tooltip + aria-label). Sem ele, usa o número cru. */
  valueFormatter?: (value: number) => string
}

function HBarChart({
  series,
  accent = "bg-primary",
  style: barStyle,
  valueFormatter,
  className,
  ...props
}: HBarChartProps) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const max = Math.max(...series.map((s) => s.value), 1)
  return (
    <div
      data-slot="h-bar-chart"
      className={cn("flex flex-col gap-3", className)}
      onMouseLeave={() => setHoverIdx(null)}
      {...props}
    >
      {series.map((s, i) => {
        const pct = Math.max((s.value / max) * 100, s.value > 0 ? 1 : 0)
        const formatted = valueFormatter ? valueFormatter(s.value) : String(s.value)
        const active = hoverIdx === i
        const dimmed = hoverIdx !== null && !active
        return (
          <div
            key={`${s.label}-${i}`}
            className={cn(
              "flex items-center gap-3 transition-opacity duration-300",
              dimmed ? "opacity-35" : "opacity-100",
            )}
            onMouseEnter={() => setHoverIdx(i)}
          >
            <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">
              {s.label}
            </span>
            {/* wrapper relative (sem overflow) p/ ancorar o tooltip acima do trilho */}
            <div className="relative flex-1">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  role="img"
                  aria-label={`${s.label}: ${formatted}`}
                  className={cn(
                    "h-full rounded-full transition-[width,box-shadow] duration-300",
                    // Se `barStyle` foi passado (cor CSS custom), NÃO aplica
                    // a classe `accent` (que viraria `bg-#40E0D0` etc.).
                    barStyle ? '' : accent,
                    active && "shadow-sm",
                  )}
                  style={{ width: `${pct}%`, ...barStyle }}
                />
              </div>
              {/* Tooltip-card no hover */}
              {active ? (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-xs shadow-md">
                  <div className="font-medium text-popover-foreground">{s.label}</div>
                  <div className="tabular-nums text-muted-foreground">{formatted}</div>
                </div>
              ) : null}
            </div>
            <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
              {formatted}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export { HBarChart }
