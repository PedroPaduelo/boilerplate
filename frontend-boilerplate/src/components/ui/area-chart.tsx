/**
 * AreaChart — gráfico de ÁREA em SVG com eixos, grade, múltiplas séries
 * (sobrepostas, empilhadas ou 100%) e TOOLTIP interativo no hover.
 *
 * Totalmente aderente ao DESIGN SYSTEM (light/dark): a grade usa `stroke-border`,
 * os ticks/labels usam `fill-muted-foreground`, o tooltip usa `bg-popover`/
 * `border-border` e as séries usam a PALETA DE CHART do tema (`var(--chart-1..5)`,
 * a mesma de line/bar/donut). O preenchimento é um gradiente SVG que vai da cor
 * da série (topo) ao transparente (base).
 *
 * Por que a cor vem da CSS var e não de classe Tailwind: um gradiente SVG
 * (`<linearGradient>`) precisa da cor LITERAL no `stop-color`, e a classe
 * `fill-chart-N` não é gerada pelo Tailwind JIT (ninguém a usa literalmente).
 * `var(--chart-N)` resolve light/dark automaticamente e não depende do JIT.
 *
 * Igual ao LineChart (do qual este é irmão): MEDE a largura real do container
 * (ResizeObserver) e desenha o viewBox em PIXELS REAIS — nunca
 * `preserveAspectRatio="none"`, que distorce/achata o traço. A altura é fixa em
 * px (`heightPx`, default 280).
 *
 * Hover: uma camada de colunas invisíveis captura o mouse por índice do eixo X;
 * ao passar, destaca os pontos (guia vertical + markers) e mostra um
 * tooltip-card com o rótulo X e o valor de cada série naquele ponto.
 *
 * Cor da série (Turno 5 — expansível via prop do bloco `accent`):
 *  - `color` (qualquer CSS color) → vai no `stroke=` da polyline, no `fill=`
 *    do gradiente e na cor de fundo da bolinha da legenda. Default: cicla
 *    a paleta `var(--chart-1..5)` por índice da série.
 *  - `style` (CSSProperties) → aplicado via `style={…}` no polyline (atributo
 *    de apresentação que vence o `stroke=` default) e merge no `style.fill`
 *    do gradiente. Use para cores CSS custom (hex/rgb/hsl/gradient). VENCE
 *    `color` quando setado.
 *  - Se AMBOS vierem: `style.stroke`/`style.fill` vencem `color` no
 *    polyline (atributos de apresentação SVG).
 */

import * as React from "react"

import { cn } from "@/shared/lib/utils"

export interface AreaSeries {
  /** Rótulo exibido na legenda/tooltip. */
  label: string
  /** Valores numéricos alinhados a `xLabels` (1 por ponto). */
  data: number[]
  /** Cor da série (qualquer CSS color). Default: cicla a paleta de chart do tema.
   *  IGNORADO se `style` for passado. */
  color?: string
  /**
   * Estilo inline aplicado ao polyline (vence `color`/`stroke=`). O caller
   * do catálogo passa o `style.stroke` e/ou `style.fill` resolvido pelo
   * `resolveAccentForStroke` (`stroke: "#ff0000"` ou
   * `fill: "url(#grad)"`). Suporta qualquer cor CSS — hex, rgb, hsl,
   * oklch, gradient, `var(--chart-1)`.
   */
  style?: React.CSSProperties
}

/** Modo de composição das áreas. */
export type AreaChartMode = "default" | "stacked" | "percent"
/** Estilo de preenchimento da área. */
export type AreaChartFill = "gradient" | "solid" | "none"

export interface AreaChartProps {
  /** Série(s) a desenhar. Cada uma vira uma área + linha de topo. */
  series: AreaSeries[]
  /** Rótulos do eixo X (1 por ponto). */
  xLabels?: string[]
  /** Altura do gráfico em px. Default: 280. */
  heightPx?: number
  /** `default` (sobrepostas), `stacked` (empilhadas) ou `percent` (100%). Default: "default". */
  mode?: AreaChartMode
  /** Preenchimento: `gradient` (default), `solid` ou `none` (só a linha). */
  fill?: AreaChartFill
  /** Linhas de grade horizontais (tracejadas). Default: true. */
  showGrid?: boolean
  /** Bloco de legenda abaixo do SVG. Default: true. */
  showLegend?: boolean
  /** Formata os rótulos do eixo Y (compacto, ex.: "2,6 mi" ou "50%"). */
  yValueFormatter?: (value: number) => string
  /** Formata o valor no TOOLTIP (completo). Default: yValueFormatter ou número. */
  valueFormatter?: (value: number) => string
  className?: string
}

/** Paleta de cores de chart do tema (mesma de line/bar/donut). */
const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const PAD = { left: 52, right: 16, top: 16, bottom: 28 }

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = Math.max(max - min, 1)
  const step = span / count
  return Array.from({ length: count + 1 }, (_, i) =>
    Math.round((min + step * i) * 100) / 100,
  )
}

/** Banda vertical de um ponto (em unidades de plotagem do eixo Y). */
interface StackBand {
  base: number
  top: number
}

/**
 * Calcula, por série, a banda {base, top} de cada ponto conforme o modo:
 *  - default: cada série vai da baseline (0) ao seu valor (áreas sobrepostas);
 *  - stacked: cada série empilha sobre a soma das anteriores;
 *  - percent: como stacked, porém normalizado para 0..100 em cada X.
 */
function buildStacks(
  series: AreaSeries[],
  mode: AreaChartMode,
  pointCount: number,
): StackBand[][] {
  const result: StackBand[][] = series.map(() => [])
  for (let i = 0; i < pointCount; i++) {
    if (mode === "default") {
      for (let s = 0; s < series.length; s++) {
        result[s].push({ base: 0, top: series[s].data[i] ?? 0 })
      }
      continue
    }
    const total = series.reduce((acc, ser) => acc + (ser.data[i] ?? 0), 0)
    const denom = mode === "percent" ? total || 1 : 1
    let cum = 0
    for (let s = 0; s < series.length; s++) {
      const v = series[s].data[i] ?? 0
      const base = cum
      const top = cum + v
      cum = top
      if (mode === "percent") {
        result[s].push({ base: (base / denom) * 100, top: (top / denom) * 100 })
      } else {
        result[s].push({ base, top })
      }
    }
  }
  return result
}

function AreaChart({
  series,
  xLabels,
  heightPx = 280,
  mode = "default",
  fill = "gradient",
  showGrid = true,
  showLegend = true,
  yValueFormatter,
  valueFormatter,
  className,
}: AreaChartProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [w, setW] = React.useState(800)
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  // id único por instância — evita colisão de <linearGradient> com outros charts.
  const uid = React.useId()

  React.useEffect(() => {
    const el = wrapRef.current
    // ResizeObserver não existe no ambiente de teste (jsdom): usa largura default.
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      if (width > 0) setW(width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const h = heightPx
  const innerW = Math.max(w - PAD.left - PAD.right, 1)
  const innerH = Math.max(h - PAD.top - PAD.bottom, 1)

  const xCount = series[0]?.data.length ?? 0
  const stacks = buildStacks(series, mode, xCount)

  // Domínio Y (em unidades de plotagem).
  let maxPlot = 0
  for (const bands of stacks) {
    for (const b of bands) maxPlot = Math.max(maxPlot, b.top)
  }
  if (mode === "percent") maxPlot = 100
  const min = 0
  const span = Math.max(maxPlot - min, 1)

  const xAt = (i: number) =>
    PAD.left + (xCount > 1 ? (i / (xCount - 1)) * innerW : innerW / 2)
  const yAt = (v: number) => PAD.top + innerH - ((v - min) / span) * innerH

  const ticks = niceTicks(min, maxPlot)
  // Cor de uma série: `style.fill`/`style.stroke` (se setado) > `color` >
  // palette cíclica por índice. Usado tanto no polyline quanto no gradiente.
  const colorOf = (i: number) =>
    series[i]?.style?.stroke ??
    series[i]?.color ??
    CHART_PALETTE[i % CHART_PALETTE.length]
  // Fill da área/gradiente: `style.fill` (se setado) > `style.stroke` >
  // `color` > palette. Suporta `var(--chart-1)` literal no gradiente.
  const fillColorOf = (i: number) =>
    series[i]?.style?.fill ??
    series[i]?.style?.stroke ??
    series[i]?.color ??
    CHART_PALETTE[i % CHART_PALETTE.length]
  const fmtTip = valueFormatter ?? yValueFormatter ?? ((v: number) => String(v))

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={wrapRef}
        className={cn("relative w-full", className)}
        style={{ height: h }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <svg
          data-slot="area-chart"
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label="Gráfico de área"
        >
          {/* Gradientes de preenchimento (1 por série), cor da paleta → transparente */}
          {fill === "gradient" && (
            <defs>
              {series.map((_, si) => {
                const id = `${uid}-area-${si}`
                const color = fillColorOf(si)
                return (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                )
              })}
            </defs>
          )}

          {/* Grid + ticks Y */}
          {showGrid &&
            ticks.map((tick, i) => {
              const y = yAt(tick)
              return (
                <g key={`grid-${i}`}>
                  <line
                    x1={PAD.left}
                    y1={y}
                    x2={w - PAD.right}
                    y2={y}
                    className="stroke-border"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={PAD.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {yValueFormatter ? yValueFormatter(tick) : tick}
                  </text>
                </g>
              )
            })}

          {/* Labels X */}
          {xLabels?.map((label, i) => (
            <text
              key={`xlabel-${i}`}
              x={xAt(i)}
              y={h - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {label}
            </text>
          ))}

          {/* Guia vertical no hover */}
          {hoverIdx != null && (
            <line
              x1={xAt(hoverIdx)}
              y1={PAD.top}
              x2={xAt(hoverIdx)}
              y2={PAD.top + innerH}
              className="stroke-muted-foreground/40"
              strokeWidth={1}
            />
          )}

          {/* Séries: área (gradiente/sólido) + linha de topo + markers no hover */}
          {series.map((s, si) => {
            const bands = stacks[si]
            const stroke = colorOf(si)
            const fillStop = fillColorOf(si)
            const topPts = bands.map((b, i) => `${xAt(i)},${yAt(b.top)}`)
            const basePts = bands
              .map((b, i) => `${xAt(i)},${yAt(b.base)}`)
              .reverse()
            const areaPts = [...topPts, ...basePts].join(" ")
            const linePts = topPts.join(" ")
            const fillValue =
              fill === "gradient"
                ? `url(#${uid}-area-${si})`
                : fill === "solid"
                  ? fillStop
                  : "none"
            return (
              <g key={`series-${si}`}>
                {fill !== "none" && (
                  <polygon
                    points={areaPts}
                    fill={fillValue}
                    fillOpacity={fill === "solid" ? 0.25 : 1}
                    stroke="none"
                  />
                )}
                <polyline
                  points={linePts}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={s.style}
                />
                {bands.map((b, i) => (
                  <circle
                    key={i}
                    cx={xAt(i)}
                    cy={yAt(b.top)}
                    r={hoverIdx === i ? 4 : 0}
                    fill={fillStop}
                    className="stroke-background"
                    strokeWidth={1.5}
                  />
                ))}
              </g>
            )
          })}
        </svg>

        {/* Camada de captura de hover (1 coluna por índice X) */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: xCount }).map((_, i) => (
            <div
              key={i}
              className="h-full flex-1"
              onMouseEnter={() => setHoverIdx(i)}
            />
          ))}
        </div>

        {/* Tooltip-card */}
        {hoverIdx != null && xCount > 0 && (
          <div
            className="pointer-events-none absolute z-10 min-w-32 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 text-xs shadow-md"
            style={{
              left: `${Math.min(Math.max(xAt(hoverIdx), 70), w - 70)}px`,
              top: PAD.top,
            }}
          >
            <div className="mb-1 font-medium text-popover-foreground">
              {xLabels?.[hoverIdx] ?? `#${hoverIdx + 1}`}
            </div>
            <div className="flex flex-col gap-0.5">
              {series.map((s, si) => (
                <div key={si} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: colorOf(si) }}
                  />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="ml-auto font-medium tabular-nums text-popover-foreground">
                    {fmtTip(s.data[hoverIdx] ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
          {series.map((s, i) => (
            <div key={`legend-${i}`} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: colorOf(i) }}
              />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { AreaChart }