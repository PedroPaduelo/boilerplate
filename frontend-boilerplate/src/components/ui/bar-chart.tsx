/**
 * BarChart — gráfico de barras VERTICAIS minimalista, com TOOLTIP no hover.
 *
 * Suporta DOIS modos:
 *
 *  1) SINGLE / agrupado plano (prop `series`): cada coluna é uma barra única.
 *     Trilho `relative flex-1` (altura resolvida pelo flex) e barra
 *     `absolute bottom-0` com `height: <pct>%`. O root usa `items-stretch`
 *     para as colunas esticarem à altura total (senão colapsam e a barra some).
 *
 *  2) STACKED / empilhado (prop `stacks`): quando `stacks` é fornecido e
 *     não-vazio, RENDERIZA empilhado e IGNORA `series`. Cada `stack` é uma
 *     categoria do eixo X com N `segments` (um por série). Os segmentos
 *     empilham de baixo p/ cima dentro do trilho (flex-col-reverse), cada um
 *     com altura proporcional ao MAIOR total entre as colunas. Tooltip no
 *     hover mostra a categoria + a quebra por série (cor + série + valor) e
 *     uma legenda série→cor é exibida abaixo das colunas (`showLegend`).
 *
 * Hover: ao passar o mouse numa coluna, ela destaca e mostra um tooltip-card.
 *
 * Cor da barra:
 *  - `accent` (Tailwind, ex.: "bg-chart-2", "bg-purple-500") → aplicado na
 *    barra via `className`. VENCE o default `bg-primary` quando setado.
 *  - `style` (CSSProperties) → aplicado na barra via `style={…}` (atributo
 *    de apresentação que vence a classe CSS).
 *  - Por ITEM/segmento: `barClassName`/`barStyle` (em `BarChartDatum` e em
 *    `BarChartStackSegment`) sobrescreve o global para aquela barra/segmento
 *    (precedência: item.style > item.barClassName > style global >
 *    barClassName/accent global > bg-primary default). Usado pelo catálogo
 *    p/ ciclar a palette (chart-1..5) ou aplicar cor custom por série
 *    (`seriesColors`).
 */

import * as React from "react"

import { cn } from "@/shared/lib/utils"

/** Um ponto da série: rótulo do eixo + valor numérico. */
export interface BarChartDatum {
  label: string
  value: number
  /**
   * Classe Tailwind da cor desta barra (ex.: "bg-chart-2", "bg-purple-500").
   * VENCE `accent` GLOBAL. Usado pelo caller do catálogo p/ ciclar
   * `paletteClass(i)` em `palette: 'multi'` ou cor custom por barra.
   */
  barClassName?: string
  /**
   * Estilo inline desta barra (ex.: `{ background: '#ff0000' }`).
   * VENCE tudo (item e global). Use para cor CSS custom por coluna.
   */
  barStyle?: React.CSSProperties
}

/**
 * (STACKED) Um segmento de uma coluna empilhada — pertence a uma série.
 * A cor de cada segmento é definida pelo caller (catálogo) via
 * `barClassName` (classe Tailwind) OU `barStyle` (cor CSS custom).
 */
export interface BarChartStackSegment {
  /** Nome da série (ex.: "Receita"). Exibido no tooltip e na legenda. */
  series: string
  value: number
  /** Classe Tailwind da cor do segmento. VENCE nada por padrão (cada
   *  segmento traz a própria cor — não há accent global no modo stacked). */
  barClassName?: string
  /** Estilo inline (cor CSS custom). VENCE `barClassName`. */
  barStyle?: React.CSSProperties
}

/** (STACKED) Uma coluna empilhada: categoria do eixo X + segmentos por série. */
export interface BarChartStack {
  /** Rótulo da categoria no eixo X (ex.: "Jan"). */
  label: string
  /** Segmentos empilhados (um por série), na ordem de empilhamento (base→topo). */
  segments: BarChartStackSegment[]
}

export interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Série de barras (rótulo + valor). O maior valor define o topo (100%).
   *  IGNORADO quando `stacks` é fornecido (modo empilhado). */
  series: BarChartDatum[]
  /**
   * (STACKED) Colunas empilhadas. Quando fornecido e NÃO-vazio, o componente
   * renderiza no modo empilhado e IGNORA `series`. Cada `stack` vira uma
   * coluna com segmentos por série, empilhados de baixo p/ cima.
   */
  stacks?: BarChartStack[]
  /** Classe Tailwind de cor de preenchimento das barras. Default: "bg-primary".
   *  IGNORADO se `style` for passado OU se a coluna trouxer o próprio
   *  `barClassName`/`barStyle` (precedência por item). No modo stacked, a cor
   *  vem dos segmentos. */
  accent?: string
  /** Estilo inline aplicado à barra. Use para cores CSS custom (hex/rgb/hsl/
   *  gradient) que NÃO existem no enum do DS. VENCE `accent` quando setado.
   *  Também é vencido por `barStyle` por item. */
  style?: React.CSSProperties
  /** Formata o valor exibido no topo da barra + tooltip. Sem ele, oculta o valor. */
  valueFormatter?: (value: number) => string
  /** Mostra o valor no topo de cada barra/coluna (requer `valueFormatter`). Default: true. */
  showValues?: boolean
  /** (STACKED) Mostra a legenda série→cor abaixo das colunas. Default: true. */
  showLegend?: boolean
}

function BarChart({
  series,
  stacks,
  accent = "bg-primary",
  style: barStyle,
  valueFormatter,
  showValues = true,
  showLegend = true,
  className,
  ...props
}: BarChartProps) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const stacked = Array.isArray(stacks) && stacks.length > 0

  // ----------------------------------------------------------------------- //
  //  MODO EMPILHADO (stacked)                                               //
  // ----------------------------------------------------------------------- //
  if (stacked) {
    const totals = stacks.map((st) =>
      st.segments.reduce((acc, seg) => acc + (seg.value || 0), 0),
    )
    const max = Math.max(...totals, 1)

    // Legenda: séries únicas (na ordem de aparição), com a cor da 1ª ocorrência.
    const legend: { series: string; barClassName?: string; barStyle?: React.CSSProperties }[] = []
    for (const st of stacks) {
      for (const seg of st.segments) {
        if (!legend.some((l) => l.series === seg.series)) {
          legend.push({ series: seg.series, barClassName: seg.barClassName, barStyle: seg.barStyle })
        }
      }
    }

    return (
      <div data-slot="bar-chart" className={cn("flex flex-col gap-2", className)} {...props}>
        <div
          className="relative flex h-56 items-stretch gap-1.5"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {stacks.map((st, i) => {
            const total = totals[i]
            const formattedTotal = valueFormatter ? valueFormatter(total) : undefined
            const active = hoverIdx === i
            return (
              <div
                key={`${st.label}-${i}`}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                onMouseEnter={() => setHoverIdx(i)}
              >
                {showValues && formattedTotal ? (
                  <span className="w-full truncate text-center text-[10px] font-medium tabular-nums text-foreground">
                    {formattedTotal}
                  </span>
                ) : null}
                {/* trilho relative com altura resolvida pelo flex (flex-1) */}
                <div className="relative flex w-full flex-1 items-end">
                  {/* segmentos empilhados de baixo p/ cima */}
                  <div className="absolute inset-x-0 bottom-0 flex w-full flex-col-reverse overflow-hidden rounded-t-md">
                    {st.segments.map((seg, j) => {
                      const segPct = Math.max((seg.value / max) * 100, seg.value > 0 ? 1 : 0)
                      return (
                        <div
                          key={`${seg.series}-${j}`}
                          className={cn(
                            "w-full transition-[height,opacity] duration-500",
                            // Se `barStyle` (cor CSS custom) foi passado, NÃO aplica
                            // a classe (que viraria `bg-#40E0D0` etc.).
                            seg.barStyle ? "" : seg.barClassName,
                            active ? "opacity-100" : "opacity-85",
                          )}
                          style={{ height: `${segPct}%`, ...seg.barStyle }}
                        />
                      )
                    })}
                  </div>
                  {/* Tooltip-card no hover: categoria + quebra por série */}
                  {active ? (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-xs shadow-md">
                      <div className="mb-0.5 font-medium text-popover-foreground">{st.label}</div>
                      {st.segments.map((seg, j) => (
                        <div
                          key={`${seg.series}-${j}`}
                          className="flex items-center gap-1.5 tabular-nums text-muted-foreground"
                        >
                          <span
                            className={cn(
                              "inline-block size-2 shrink-0 rounded-[2px]",
                              seg.barStyle ? "" : seg.barClassName,
                            )}
                            style={seg.barStyle}
                          />
                          <span className="text-popover-foreground">{seg.series}</span>
                          <span className="ml-auto pl-2">
                            {valueFormatter ? valueFormatter(seg.value) : seg.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>
        {showLegend && legend.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {legend.map((l, i) => (
              <span
                key={`${l.series}-${i}`}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <span
                  className={cn(
                    "inline-block size-2 shrink-0 rounded-[2px]",
                    l.barStyle ? "" : l.barClassName,
                  )}
                  style={l.barStyle}
                />
                {l.series}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  // ----------------------------------------------------------------------- //
  //  MODO SINGLE / agrupado plano                                           //
  // ----------------------------------------------------------------------- //
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
        // Precedência de cor POR ITEM:
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
