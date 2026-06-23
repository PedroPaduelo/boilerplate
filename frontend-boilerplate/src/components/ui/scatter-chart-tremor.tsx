/**
 * ScatterChartTremor — gráfico de DISPERSÃO (recharts) TEMATIZADO no design
 * system (Tailwind/shadcn), funcionando em light/dark.
 *
 * Originalmente importado do Tremor, usava cores/estilos HARDCODED (paleta
 * `blue/emerald/...`, `bg-white`, `border-gray-200`, `fill-gray-500`,
 * `stroke-gray-200`, cursor `#d1d5db`) que não casavam com o tema. Esta versão
 * troca tudo por TOKENS do tema, alinhando o visual aos demais blocos do
 * catálogo (line_chart, bar_chart, donut):
 *  - pontos + legenda: paleta de chart do DS (`chart-1..5`), a mesma dos outros;
 *  - grade: `stroke-border`, sutil e tracejada (igual ao line_chart);
 *  - eixos/ticks: `fill-muted-foreground`, valores formatados por callback;
 *  - tooltip: `bg-popover` / `border-border` / `text-popover-foreground` +
 *    sombra, exibindo a categoria (série) e as coordenadas X/Y formatadas;
 *  - cursor (crosshair): `stroke-muted-foreground/40`.
 *
 * As cores são aplicadas via CLASSE Tailwind (não via prop `stroke`/`fill` nem
 * `var()` em atributo): o recharts espalha a className nas linhas/símbolos, e a
 * regra CSS da classe (que resolve `var(--color-*)`) vence o atributo de
 * apresentação default — por isso o tema é respeitado de verdade.
 *
 * Não depende mais das cores do Tremor (`tremor-utils`): só `recharts` + `cn`.
 */
import * as React from "react"
import {
  CartesianGrid,
  Legend as RechartsLegend,
  ResponsiveContainer,
  Scatter,
  ScatterChart as ReChartsScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

import { cn } from "@/shared/lib/utils"

/* -------------------------------------------------------------------------- */
/* Paleta de cores de chart do design system (mesma de line/bar/donut).        */
/* Strings LITERAIS — o Tailwind não detecta classes interpoladas.             */
/* -------------------------------------------------------------------------- */

const CHART_FILL = [
  "fill-chart-1",
  "fill-chart-2",
  "fill-chart-3",
  "fill-chart-4",
  "fill-chart-5",
] as const
const CHART_STROKE = [
  "stroke-chart-1",
  "stroke-chart-2",
  "stroke-chart-3",
  "stroke-chart-4",
  "stroke-chart-5",
] as const
const CHART_BG = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
] as const

const PALETTE_SIZE = CHART_FILL.length

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/** Uma linha do dataset: precisa ter `x` (number), `y` (number) e `category` (string). */
export type ScatterChartTremorDatum = Record<string, unknown> & {
  x: number
  y: number
  category: string
  size?: number
}

export interface ScatterChartTremorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "data"> {
  /** Dataset "long-format" — uma linha por ponto (x, y). */
  data: ScatterChartTremorDatum[]
  /** Chave do campo que separa os grupos (cada um vira uma cor/série). */
  category: string
  /** Chave do valor do eixo X (number). */
  x: string
  /** Chave do valor do eixo Y (number). */
  y: string
  /** Chave do tamanho da bolha (opcional — quando ausente, todas têm o mesmo raio). */
  size?: string
  /** Range do raio da bolha em px quando `size` é fornecido. Default: [60, 500]. */
  sizeRange?: [number, number]
  /** Formata os valores exibidos no TOOLTIP (completo, ex.: "1.234,5"). */
  valueFormatter?: (value: number) => string
  /** Formata os ticks dos eixos (compacto). Default: `valueFormatter`. */
  axisValueFormatter?: (value: number) => string
  /** Rótulo do eixo X exibido no tooltip. Default: "X". */
  xAxisLabel?: string
  /** Rótulo do eixo Y exibido no tooltip. Default: "Y". */
  yAxisLabel?: string
  /** Exibe a legenda clicável acima do chart. Default: true. */
  showLegend?: boolean
  /** Anima a entrada dos pontos (Recharts). Default: false. */
  showAnimation?: boolean
  /** Aplica opacidade reduzida (0.7) aos pontos para destacar sobreposição. Default: false. */
  showOpacity?: boolean
  /** Largura fixa do eixo Y em px. Default: 56. */
  yAxisWidth?: number
  /** Mostra linhas de grade. Default: true. */
  showGridLines?: boolean
  /** Mostra eixo X. Default: true. */
  showXAxis?: boolean
  /** Mostra eixo Y. Default: true. */
  showYAxis?: boolean
  /** Altura do container (classe Tailwind). Default: "h-80". */
  height?: string
}

/** Formatador padrão: inteiros sem casa, fracionários com 1 casa. */
const defaultFormatter = (num: number): string =>
  Number.isInteger(num) ? num.toString() : num.toFixed(1)

/* -------------------------------------------------------------------------- */
/* Tooltip — tematizado (categoria + coordenadas X/Y)                          */
/* -------------------------------------------------------------------------- */

interface ScatterTooltipProps {
  categoryLabel: string
  colorIdx: number
  xLabel: string
  yLabel: string
  xValue: number
  yValue: number
  valueFormatter: (value: number) => string
}

const ScatterTooltip = ({
  categoryLabel,
  colorIdx,
  xLabel,
  yLabel,
  xValue,
  yValue,
  valueFormatter,
}: ScatterTooltipProps) => (
  <div className="min-w-36 rounded-lg border border-border bg-popover text-xs shadow-md">
    <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
      <span
        aria-hidden="true"
        className={cn("size-2.5 shrink-0 rounded-full", CHART_BG[colorIdx])}
      />
      <span className="font-medium text-popover-foreground">{categoryLabel}</span>
    </div>
    <div className="flex flex-col gap-1 px-3 py-2">
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">{xLabel}</span>
        <span className="font-medium tabular-nums text-popover-foreground">
          {valueFormatter(xValue)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">{yLabel}</span>
        <span className="font-medium tabular-nums text-popover-foreground">
          {valueFormatter(yValue)}
        </span>
      </div>
    </div>
  </div>
)

/* -------------------------------------------------------------------------- */
/* Legend — tematizada (texto muted, hover bg-muted, dot bg-chart-N)           */
/* -------------------------------------------------------------------------- */

interface LegendItemProps {
  name: string
  colorIdx: number
  onClick?: (name: string) => void
  activeLegend?: string
}

const LegendItem = ({ name, colorIdx, onClick, activeLegend }: LegendItemProps) => {
  const interactive = !!onClick
  const isDimmed = !!activeLegend && activeLegend !== name
  return (
    <li
      className={cn(
        "group inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors",
        interactive ? "cursor-pointer hover:bg-muted" : "cursor-default",
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(name)
      }}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2.5 shrink-0 rounded-full",
          CHART_BG[colorIdx],
          isDimmed ? "opacity-40" : "opacity-100",
        )}
      />
      <p
        className={cn(
          "truncate whitespace-nowrap text-xs text-muted-foreground",
          isDimmed ? "opacity-40" : "opacity-100",
        )}
      >
        {name}
      </p>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/* Componente                                                                  */
/* -------------------------------------------------------------------------- */

const ScatterChartTremor = React.forwardRef<HTMLDivElement, ScatterChartTremorProps>(
  (props, ref) => {
    const {
      data = [],
      category,
      x,
      y,
      size,
      sizeRange = [60, 500],
      valueFormatter = defaultFormatter,
      axisValueFormatter,
      xAxisLabel = "X",
      yAxisLabel = "Y",
      showLegend = true,
      showAnimation = false,
      showOpacity = false,
      yAxisWidth = 56,
      showGridLines = true,
      showXAxis = true,
      showYAxis = true,
      height = "h-80",
      className,
      ...other
    } = props

    const axisFormatter = axisValueFormatter ?? valueFormatter

    // Categorias únicas na ORDEM DE APARIÇÃO → índice de cor da paleta (cíclico).
    const categories = React.useMemo(
      () => Array.from(new Set(data.map((d) => String(d[category])))),
      [data, category],
    )
    const colorIndex = React.useMemo(() => {
      const map = new Map<string, number>()
      categories.forEach((cat, i) => map.set(cat, i % PALETTE_SIZE))
      return map
    }, [categories])

    // Estado: legenda ativa (item clicado → dim das outras categorias).
    const [activeLegend, setActiveLegend] = React.useState<string | undefined>(undefined)
    const handleClickLegendItem = React.useCallback((cat: string) => {
      setActiveLegend((prev) => (prev === cat ? undefined : cat))
    }, [])

    const fillOpacity = (cat: string) => {
      if (showOpacity) return 0.7
      if (activeLegend && activeLegend !== cat) return 0.3
      return 1
    }

    return (
      <div
        ref={ref}
        className={cn("w-full", height, className)}
        data-slot="scatter-chart-tremor"
        tremor-id="tremor-raw"
        {...other}
      >
        <ResponsiveContainer className="size-full">
          <ReChartsScatterChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            {showGridLines ? (
              <CartesianGrid
                className="stroke-border"
                strokeDasharray="4 4"
                horizontal
                vertical
              />
            ) : null}
            <XAxis
              hide={!showXAxis}
              dataKey={x}
              type="number"
              name={x}
              tick={{ transform: "translate(0, 6)" }}
              fill=""
              stroke=""
              className="fill-muted-foreground text-xs"
              tickLine={false}
              axisLine={false}
              minTickGap={5}
              tickFormatter={axisFormatter}
            />
            <YAxis
              width={yAxisWidth}
              hide={!showYAxis}
              type="number"
              name={y}
              dataKey={y}
              tick={{ transform: "translate(-3, 0)" }}
              tickFormatter={axisFormatter}
              fill=""
              stroke=""
              className="fill-muted-foreground text-xs"
              tickLine={false}
              axisLine={false}
              allowDecimals
            />
            {size ? (
              <ZAxis type="number" dataKey={size} range={sizeRange} name={size} />
            ) : null}
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              isAnimationActive={false}
              cursor={{
                className: "stroke-muted-foreground/40",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              content={(tooltipProps) => {
                const items = tooltipProps.payload
                const raw =
                  items && items.length
                    ? (items[0]?.payload as Record<string, unknown> | undefined)
                    : undefined
                if (!tooltipProps.active || !raw) return null
                const cat = String(raw[category] ?? "")
                return (
                  <ScatterTooltip
                    categoryLabel={cat}
                    colorIdx={colorIndex.get(cat) ?? 0}
                    xLabel={xAxisLabel}
                    yLabel={yAxisLabel}
                    xValue={Number(raw[x] ?? 0)}
                    yValue={Number(raw[y] ?? 0)}
                    valueFormatter={valueFormatter}
                  />
                )
              }}
            />
            {showLegend ? (
              <RechartsLegend
                verticalAlign="top"
                height={36}
                content={() => (
                  <div className="mb-2 flex items-center justify-end">
                    <ol className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                      {categories.map((cat) => (
                        <LegendItem
                          key={cat}
                          name={cat}
                          colorIdx={colorIndex.get(cat) ?? 0}
                          onClick={handleClickLegendItem}
                          activeLegend={activeLegend}
                        />
                      ))}
                    </ol>
                  </div>
                )}
              />
            ) : null}
            {categories.map((cat) => {
              const idx = colorIndex.get(cat) ?? 0
              const seriesData = data.filter((d) => String(d[category]) === cat)
              return (
                <Scatter
                  key={cat}
                  className={cn(CHART_FILL[idx], CHART_STROKE[idx])}
                  fillOpacity={fillOpacity(cat)}
                  name={cat}
                  data={seriesData}
                  isAnimationActive={showAnimation}
                />
              )
            })}
          </ReChartsScatterChart>
        </ResponsiveContainer>
      </div>
    )
  },
)

ScatterChartTremor.displayName = "ScatterChartTremor"

export { ScatterChartTremor }
