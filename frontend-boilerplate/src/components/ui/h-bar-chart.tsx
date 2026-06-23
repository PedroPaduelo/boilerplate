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
 *
 * Cor da barra (Turno 5 — `accent`/`style` global + Turno 6 — `barClassName`/
 * `barStyle` por item p/ `palette: 'multi'`):
 *  - `barClassName` (Tailwind, ex.: "bg-chart-2", "bg-purple-500") → aplicado
 *    na barra via `className`. VENCE o default `bg-primary` quando setado.
 *  - `style` (CSSProperties) → aplicado na barra via `style={…}` (atributo
 *    de apresentação que vence a classe CSS).
 *  - Por ITEM (Turno 6): `HBarChartDatum.barClassName`/`barStyle` sobrescreve
 *    o global para aquela barra (precedência: item.style > item.barClassName
 *    > style global > barClassName global > bg-primary default). Usado pelo
 *    catálogo p/ ciclar a palette de charts (chart-1..5) em `palette: 'multi'`.
 */

import * as React from "react"

import { cn } from "@/shared/lib/utils"

/** Um ponto da série: rótulo + valor numérico. */
export interface HBarChartDatum {
  label: string
  value: number
  /**
   * (Turno 6) Classe Tailwind da cor desta barra (ex.: "bg-chart-2",
   * "bg-purple-500"). VENCE `barClassName` GLOBAL. Usado pelo caller
   * do catálogo p/ ciclar `paletteClass(i)` em `palette: 'multi'`.
   */
  barClassName?: string
  /**
   * (Turno 6) Estilo inline desta barra (ex.: `{ background: '#ff0000' }`).
   * VENCE tudo (item e global). Use para cor CSS custom por linha.
   */
  barStyle?: React.CSSProperties
}

export interface HBarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Série de barras (rótulo + valor). O maior valor define a barra cheia (100%). */
  series: HBarChartDatum[]
  /** Classe Tailwind de cor de preenchimento das barras. Default: "bg-primary".
   *  IGNORADO se `style` for passado OU se a linha trouxer o próprio
   *  `barClassName`/`barStyle` (Turno 6 — precedência por item). */
  accent?: string
  /** Estilo inline aplicado à barra. Use para cores CSS custom (hex/rgb/hsl/
   *  gradient) que NÃO existem no enum do DS. VENCE `accent` quando setado.
   *  Também é vencido por `barStyle` por item (Turno 6). */
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
                    // Se `itemBarStyle` foi passado (cor CSS custom), NÃO aplica
                    // a classe `accent` (que viraria `bg-#40E0D0` etc.).
                    itemBarStyle ? '' : itemBarClassName,
                    active && "shadow-sm",
                  )}
                  style={{ width: `${pct}%`, ...itemBarStyle }}
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
