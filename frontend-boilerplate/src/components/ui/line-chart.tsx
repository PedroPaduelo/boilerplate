/**
 * LineChart — gráfico de linha em SVG com eixos, grid, área e legenda.
 *
 * Desenha uma ou mais séries temporais como polylines sobre um par de eixos
 * (X com labels, Y com valores normalizados). Oferece grid tracejado opcional,
 * preenchimento de área translúcida por série, e legenda com indicadores de
 * cor. A escala vertical é normalizada ao min/max global de todas as séries,
 * garantindo proporção consistente entre linhas concorrentes. Cores via classes
 * Tailwind em cada série (ou `stroke-primary` como default).
 *
 * Sem dependências externas, sem estado. O elemento raiz é o próprio <svg>
 * com `data-slot="line-chart"`, aceitando className/props padrão de um SVG.
 *
 * Segue a mesma filosofia do Sparkline (SVG puro, classes Tailwind para cores,
 * normalização local min/max), adicionando eixos, grid, múltiplas séries e
 * legenda.
 */

import * as React from "react"

import { cn } from "@/shared/lib/utils"

export interface LineSeries {
  /** Rótulo exibido na legenda. */
  label: string
  /** Série de valores numéricos. */
  data: number[]
  /** Classe Tailwind da cor da linha. Default: "stroke-primary". */
  className?: string
}

export interface LineChartProps
  extends Omit<
    React.SVGProps<SVGSVGElement>,
    "children" | "width" | "height"
  > {
  /** Série(s) de valores a traçar. Cada uma vira uma polyline. */
  series: LineSeries[]
  /** Rótulos do eixo X (comprimento deve bater com `series[].data.length`). */
  xLabels?: string[]
  /** Altura renderizada via className. Default: "h-48". */
  height?: string
  /** Se true, preenche área abaixo de cada linha. Default: true. */
  showArea?: boolean
  /** Se true, desenha linhas de grid tracejadas. Default: true. */
  showGrid?: boolean
  /** Se true, renderiza bloco de legenda abaixo do SVG. Default: true. */
  showLegend?: boolean
  /** Largura do viewBox (sistema de coordenadas). Default: 600. */
  width?: number
  /** Altura do viewBox (sistema de coordenadas). Default: 200. */
  viewBoxHeight?: number
  /** Formata os rótulos numéricos do eixo Y (ex.: "R$ 2,6 mi"). Sem ele, número cru. */
  yValueFormatter?: (value: number) => string
}

/* -------------------------------------------------------------------------- */
/* Helpers internos                                                            */
/* -------------------------------------------------------------------------- */

const PADDING_LEFT = 36
const PADDING_BOTTOM = 24
const PADDING_TOP = 12
const PADDING_RIGHT = 12

function buildPoints(
  data: number[],
  min: number,
  span: number,
  w: number,
  h: number,
): string[] {
  const innerW = w - PADDING_LEFT - PADDING_RIGHT
  const innerH = h - PADDING_TOP - PADDING_BOTTOM
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW
  return data.map((p, i) => {
    const x = PADDING_LEFT + i * step
    const y = PADDING_TOP + innerH - ((p - min) / span) * innerH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
}

function yAxisTicks(min: number, max: number, count = 4): number[] {
  const span = Math.max(max - min, 1)
  const step = span / count
  return Array.from({ length: count + 1 }, (_, i) =>
    Math.round((min + step * i) * 100) / 100,
  )
}

/* -------------------------------------------------------------------------- */
/* Componente                                                                  */
/* -------------------------------------------------------------------------- */

function LineChart({
  series,
  xLabels,
  height = "h-48",
  showArea = true,
  showGrid = true,
  showLegend = true,
  width = 600,
  viewBoxHeight = 200,
  yValueFormatter,
  className,
  ...props
}: LineChartProps) {
  const w = width
  const h = viewBoxHeight
  const innerW = w - PADDING_LEFT - PADDING_RIGHT
  const innerH = h - PADDING_TOP - PADDING_BOTTOM

  // Normalização global: min/max de todas as séries juntas
  const allValues = series.flatMap((s) => s.data)
  const max = allValues.length > 0 ? Math.max(...allValues) : 0
  const min = allValues.length > 0 ? Math.min(...allValues) : 0
  const span = Math.max(max - min, 1)

  const ticks = yAxisTicks(min, max)
  const tickStep = allValues.length > 1 ? innerW / (allValues.length - 1) : innerW
  void tickStep

  return (
    <div className="flex flex-col gap-2">
      <svg
        data-slot="line-chart"
        viewBox={`0 0 ${w} ${h}`}
        className={cn("w-full", height, className)}
        preserveAspectRatio="none"
        role="img"
        aria-label="Gráfico de linha"
        {...props}
      >
        {/* Grid horizontal tracejado + ticks do eixo Y */}
        {showGrid &&
          ticks.map((tick, i) => {
            const y =
              PADDING_TOP + innerH - ((tick - min) / span) * innerH
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={w - PADDING_RIGHT}
                  y2={y}
                  className="stroke-border"
                  strokeWidth={0.5}
                  strokeDasharray="4 4"
                />
                <text
                  x={PADDING_LEFT - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted-foreground text-[8px]"
                >
                  {yValueFormatter ? yValueFormatter(tick) : tick}
                </text>
              </g>
            )
          })}

        {/* Eixo X labels */}
        {xLabels &&
          xLabels.map((label, i) => {
            const seriesLen = series[0]?.data.length ?? xLabels.length
            const step =
              seriesLen > 1 ? innerW / (seriesLen - 1) : innerW
            const x = PADDING_LEFT + i * step
            return (
              <text
                key={`xlabel-${i}`}
                x={x}
                y={h - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[8px]"
              >
                {label}
              </text>
            )
          })}

        {/* Linha do eixo X */}
        <line
          x1={PADDING_LEFT}
          y1={PADDING_TOP + innerH}
          x2={w - PADDING_RIGHT}
          y2={PADDING_TOP + innerH}
          className="stroke-border"
          strokeWidth={0.5}
        />

        {/* Linha do eixo Y */}
        <line
          x1={PADDING_LEFT}
          y1={PADDING_TOP}
          x2={PADDING_LEFT}
          y2={PADDING_TOP + innerH}
          className="stroke-border"
          strokeWidth={0.5}
        />

        {/* Séries (polylines + área) */}
        {series.map((s, si) => {
          const pts = buildPoints(s.data, min, span, w, h)
          const linePoints = pts.join(" ")
          const strokeClass = s.className ?? "stroke-primary"
          const areaPoints = `${PADDING_LEFT},${PADDING_TOP + innerH} ${linePoints} ${PADDING_LEFT + innerW},${PADDING_TOP + innerH}`
          const areaFillClass = strokeClass.replace(
            "stroke-",
            "fill-",
          )
          return (
            <g key={`series-${si}`}>
              {showArea && (
                <polygon points={areaPoints} className={cn(areaFillClass, "opacity-10")} />
              )}
              <polyline
                points={linePoints}
                fill="none"
                className={cn(strokeClass)}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )
        })}
      </svg>

      {/* Legenda */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
          {series.map((s, i) => (
            <div
              key={`legend-${i}`}
              className="flex items-center gap-1.5"
            >
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  s.className?.replace("stroke-", "bg-") ?? "bg-primary",
                )}
              />
              <span className="text-muted-foreground text-xs">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { LineChart }
