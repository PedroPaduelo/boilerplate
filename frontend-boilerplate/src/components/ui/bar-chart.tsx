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
 *
 * Cor da barra (Turno 5 — `accent`/`style` global + Turno 6 — `barClassName`/
 * `barStyle` por item p/ `palette: 'multi'`):
 *  - `accent` (Tailwind, ex.: "bg-chart-2", "bg-purple-500") → aplicado na
 *    barra via `className`. VENCE o default `bg-primary` quando setado.
 *  - `style` (CSSProperties) → aplicado na barra via `style={…}` (atributo
 *    de apresentação que vence a classe CSS).
 *  - Por ITEM (Turno 6): `BarChartDatum.barClassName`/`barStyle` sobrescreve
 *    o global para aquela coluna (precedência: item.style > item.barClassName
 *    > style global > barClassName global > bg-primary default). Usado pelo
 *    catálogo p/ ciclar a palette de charts (chart-1..5) em `palette: 'multi'`.
 */

import * as React from "react"

import { cn } from "@/shared/lib/utils"

/** Um ponto da série: rótulo do eixo + valor numérico. */
export interface BarChartDatum {
  label: string
  value: number
  /**
   * (Turno 6) Classe Tailwind da cor desta barra (ex.: "bg-chart-2",
   * "bg-purple-500"). VENCE `accent` GLOBAL. Usado pelo caller do
   * catálogo p/ ciclar `paletteClass(i)` em `palette: 'multi'`.
   */
  barClassName?: string
  /**
   * (Turno 6) Estilo inline desta barra (ex.: `{ background: '#ff0000' }`).
   * VENCE tudo (item e global). Use para cor CSS custom por coluna.
   */
  barStyle?: React.CSSProperties
}

export interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Série de barras (rótulo + valor). O maior valor define o topo (100%). */
  series: BarChartDatum[]
  /** Classe Tailwind de cor de preenchimento das barras. Default: "bg-primary".
   *  IGNORADO se `style` for passado OU se a coluna trouxer o próprio
   *  `barClassName`/`barStyle` (Turno 6 — precedência por item). */
  accent?: string
  /** Estilo inline aplicado à barra. Use para cores CSS custom (hex/rgb/hsl/
   *  gradient) que NÃO existem no enum do DS. VENCE `accent` quando setado.
   *  Também é vencido por `barStyle` por item (Turno 6). */
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
        // Precedência de cor POR ITEM (Turno 6):
        //   1) item.barStyle (CSS custom, vence tudo)
        //   2) item.barClassName (classe Tailwind do item)
        //   3) barStyle global (CSS custom)
        //   4) barClassName/accent global (classe Tailwind)
        //   5) bg-primary (default, hardcoded)
        const itemBarStyle = s.barStyle ?? barStyle
        const itemBarClassName = s.barClassName ?? accent
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
                  // Se `itemBarStyle` foi passado (cor CSS custom), NÃO aplica
                  // a classe `accent` (que viraria `bg-#40E0D0` etc.).
                  itemBarStyle ? '' : itemBarClassName,
                  active ? "opacity-100" : "opacity-85",
                )}
                style={{ height: `${pct}%`, ...itemBarStyle }}
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
