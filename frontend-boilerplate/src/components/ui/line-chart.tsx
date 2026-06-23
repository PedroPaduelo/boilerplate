/**
 * LineChart — gráfico de linha em SVG com eixos, grid, área, markers e TOOLTIP
 * interativo no hover.
 *
 * Diferente da versão anterior (que usava `preserveAspectRatio="none"` + viewBox
 * fixo e DISTORCIA ao esticar), este componente MEDE a largura real do container
 * (ResizeObserver) e desenha o viewBox em PIXELS REAIS — assim o stroke fica
 * uniforme e nada estica. A altura é fixa em px (`heightPx`).
 *
 * Hover: uma camada de colunas invisíveis captura o mouse por índice do eixo X;
 * ao passar, destaca o ponto (guia vertical + markers) e mostra um tooltip-card
 * com o rótulo X e o valor de cada série naquele ponto.
 *
 * Cor da série (Turno 5 — expansível via prop do bloco `accent`):
 *  - `className` (Tailwind, ex.: "stroke-chart-1") → aplica no `stroke` da
 *    polyline/marker e no `fill` do marker (a regra CSS do tema resolve
 *    `var(--color-chart-1)`).
 *  - `style` (CSSProperties) → aplicado no polyline/marker via `style={…}`
 *    (atributo de apresentação que vence o `stroke=` default). O caller
 *    do catálogo passa o `style.stroke` resolvido pelo `resolveAccentForStroke`.
 *  - Se AMBOS vierem: `style` VENCE (`style.stroke` tem prioridade sobre
 *    `className` em atributos de apresentação SVG). Cobre cor custom
 *    (`#40E0D0`, `rgb(0,255,0)`, `oklch(...)`, `linear-gradient(...)`).
 */

import * as React from "react"

import { cn } from "@/shared/lib/utils"

export interface LineSeries {
  /** Rótulo exibido na legenda/tooltip. */
  label: string
  /** Série de valores numéricos. */
  data: number[]
  /** Classe Tailwind da cor da linha (ex.: "stroke-chart-1"). Default: "stroke-primary".
   *  IGNORADO se `style` for passado. */
  className?: string
  /**
   * Estilo inline aplicado ao `stroke` da polyline + marker + `fill` do
   * marker. Use para cores CSS custom (hex/rgb/hsl/gradient) que NÃO
   * existem no enum do DS. VENCE `className` quando setado. Suporta
   * `stroke: "var(--chart-1)"` ou `stroke: "#ff0000"`.
   */
  style?: React.CSSProperties
}

export interface LineChartProps {
  /** Série(s) de valores a traçar. Cada uma vira uma polyline. */
  series: LineSeries[]
  /** Rótulos do eixo X (1 por ponto). */
  xLabels?: string[]
  /** Altura do gráfico em px. Default: 280. */
  heightPx?: number
  /** Se true, preenche área abaixo de cada linha. Default: true. */
  showArea?: boolean
  /**
   * Se true, desenha as linhas como CURVAS suaves (Catmull-Rom → cubic
   * Bézier via `<path>`), em vez de segmentos retos (`<polyline>`). A área
   * também acompanha a curva. Default: false (retas).
   */
  smooth?: boolean
  /** Se true, desenha linhas de grid tracejadas. Default: true. */
  showGrid?: boolean
  /** Se true, renderiza bloco de legenda abaixo do SVG. Default: true. */
  showLegend?: boolean
  /** Formata os rótulos do eixo Y (compacto, ex.: "2,6 mi"). */
  yValueFormatter?: (value: number) => string
  /** Formata o valor no TOOLTIP (completo, ex.: "R$ 2.609.946,73"). Default: yValueFormatter ou número. */
  valueFormatter?: (value: number) => string
  className?: string
}

const PAD = { left: 52, right: 16, top: 16, bottom: 28 }

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = Math.max(max - min, 1)
  const step = span / count
  return Array.from({ length: count + 1 }, (_, i) =>
    Math.round((min + step * i) * 100) / 100,
  )
}

/**
 * Gera o atributo `d` de um `<path>` que passa por todos os `points`
 * usando spline Catmull-Rom convertida para curvas cubic Bézier — produz
 * uma linha suave (smooth) sem overshoot agressivo. Com menos de 3 pontos
 * cai para segmentos retos (M/L). Cada ponto é `[x, y]` em px.
 */
function buildSmoothPath(points: ReadonlyArray<readonly [number, number]>): string {
  if (points.length === 0) return ""
  if (points.length < 3) {
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`)
      .join(" ")
  }
  const d: string[] = [`M${points[0][0]},${points[0][1]}`]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`)
  }
  return d.join(" ")
}

function LineChart({
  series,
  xLabels,
  heightPx = 280,
  showArea = true,
  smooth = false,
  showGrid = true,
  showLegend = true,
  yValueFormatter,
  valueFormatter,
  className,
}: LineChartProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [w, setW] = React.useState(800)
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)

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

  const allValues = series.flatMap((s) => s.data)
  const max = allValues.length > 0 ? Math.max(...allValues) : 0
  const min = Math.min(0, allValues.length > 0 ? Math.min(...allValues) : 0)
  const span = Math.max(max - min, 1)

  const xCount = series[0]?.data.length ?? 0
  const xAt = (i: number) =>
    PAD.left + (xCount > 1 ? (i / (xCount - 1)) * innerW : innerW / 2)
  const yAt = (v: number) => PAD.top + innerH - ((v - min) / span) * innerH

  const ticks = niceTicks(min, max)
  const fmtTip = valueFormatter ?? yValueFormatter ?? ((v: number) => String(v))

  // Helper: devolve o className de stroke de uma série. Quando `style.stroke`
  // estiver setado, devolvemos `undefined` (o atributo `style` cuida da cor;
  // atributos de apresentação SVG vencem a classe CSS).
  const strokeClassOf = (s: LineSeries): string | undefined =>
    s.style?.stroke ? undefined : (s.className ?? "stroke-primary")
  // Equivalente para fill (marker, área). Se style.stroke vier e style.fill
  // NÃO vier, derivamos um fill do stroke (mesma cor, alpha 0.1) via style.
  const fillClassOf = (s: LineSeries): string | undefined =>
    s.style?.stroke ? undefined : (s.className ?? "stroke-primary").replace("stroke-", "fill-")
  // Style do marker (fill): se style.stroke vier mas sem style.fill, cria
  // um fill com a mesma cor (alpha 0.1) pra parecer com a área.
  const markerStyleOf = (s: LineSeries): React.CSSProperties | undefined => {
    if (!s.style?.stroke) return undefined
    if (s.style.fill) return s.style
    return { ...s.style, fillOpacity: 0.1 }
  }
  // Style da área (fill com alpha): mesma técnica do marker.
  const areaStyleOf = (s: LineSeries): React.CSSProperties | undefined => {
    if (!s.style?.stroke) return undefined
    if (s.style.fill) return { fill: s.style.fill, fillOpacity: 0.1 }
    return { fill: s.style.stroke, fillOpacity: 0.1 }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={wrapRef}
        className={cn("relative w-full", className)}
        style={{ height: h }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <svg
          data-slot="line-chart"
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label="Gráfico de linha"
        >
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

          {/* Séries: área + linha + markers */}
          {series.map((s, si) => {
            const strokeCls = strokeClassOf(s)
            const fillCls = fillClassOf(s)
            const pts = s.data.map(
              (v, i) => [xAt(i), yAt(v)] as [number, number],
            )
            const baseY = PAD.top + innerH
            const linePts = pts.map((p) => `${p[0]},${p[1]}`).join(" ")
            const areaPts = `${xAt(0)},${baseY} ${linePts} ${xAt(
              s.data.length - 1,
            )},${baseY}`
            // smooth: `<path>` com curva Catmull-Rom; reto: `<polyline>`/`<polygon>`.
            const linePath = smooth ? buildSmoothPath(pts) : ""
            const areaPath =
              smooth && pts.length > 0
                ? `${linePath} L${pts[pts.length - 1][0]},${baseY} L${pts[0][0]},${baseY} Z`
                : ""
            return (
              <g key={`series-${si}`}>
                {showArea &&
                  pts.length > 0 &&
                  (smooth ? (
                    <path
                      d={areaPath}
                      className={cn(fillCls, "opacity-10")}
                      style={areaStyleOf(s)}
                    />
                  ) : (
                    <polygon
                      points={areaPts}
                      className={cn(fillCls, "opacity-10")}
                      style={areaStyleOf(s)}
                    />
                  ))}
                {smooth ? (
                  <path
                    d={linePath}
                    fill="none"
                    className={strokeCls}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={s.style}
                  />
                ) : (
                  <polyline
                    points={linePts}
                    fill="none"
                    className={strokeCls}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={s.style}
                  />
                )}
                {s.data.map((v, i) => (
                  <circle
                    key={i}
                    cx={xAt(i)}
                    cy={yAt(v)}
                    r={hoverIdx === i ? 4.5 : 2.5}
                    className={cn(fillCls, "stroke-background")}
                    strokeWidth={1.5}
                    style={markerStyleOf(s)}
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
                    className={cn(
                      "inline-block h-2 w-2 shrink-0 rounded-full",
                      // bolinha da legenda: usa style.stroke ou className
                      // (mesma técnica do polyline).
                      s.style?.stroke
                        ? ""
                        : s.className?.replace("stroke-", "bg-") ?? "bg-primary",
                    )}
                    style={
                      s.style?.stroke
                        ? { backgroundColor: s.style.stroke }
                        : undefined
                    }
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
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-1">
          {series.map((s, i) => (
            <div key={`legend-${i}`} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  s.style?.stroke
                    ? ""
                    : s.className?.replace("stroke-", "bg-") ?? "bg-primary",
                )}
                style={
                  s.style?.stroke
                    ? { backgroundColor: s.style.stroke }
                    : undefined
                }
              />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { LineChart }