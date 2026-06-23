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
import {
  AvailableChartColors,
  type AvailableChartColorsKeys,
  constructCategoryColors,
  getColorClassName,
} from "@/shared/lib/tremor-utils"

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
  /** Chave do campo que separa os grupos (cada vira uma cor/série). */
  category: string
  /** Chave do valor do eixo X (number). */
  x: string
  /** Chave do valor do eixo Y (number). */
  y: string
  /** Chave do tamanho da bolha (opcional — quando ausente, todas têm o mesmo raio). */
  size?: string
  /** Pool de cores Tremor por categoria (cíclico). */
  colors?: AvailableChartColorsKeys[]
  /** Range do raio da bolha em px quando `size` é fornecido. Default: [60, 500]. */
  sizeRange?: [number, number]
  /** Formatador dos valores exibidos em tooltips/axes. */
  valueFormatter?: (value: number) => string
  /** Exibe a legenda clicável acima do chart. Default: true. */
  showLegend?: boolean
  /** Anima a entrada dos pontos (Recharts). Default: false. */
  showAnimation?: boolean
  /** Aplica opacidade reduzida (0.7) aos pontos para destacar sobreposição. Default: false. */
  showOpacity?: boolean
  /** Largura fixa do eixo Y em px. Default: 56 (mesmo do Tremor). */
  yAxisWidth?: number
  /** Mostra linhas de grid. Default: true. */
  showGridLines?: boolean
  /** Mostra eixo X. Default: true. */
  showXAxis?: boolean
  /** Mostra eixo Y. Default: true. */
  showYAxis?: boolean
  /** Altura do container. Default: "h-80" (mesmo do Tremor). */
  height?: string
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Formatador padrão (Tremor style): inteiros sem casa, fracionários com 1 casa. */
const formatNumber = (num: number): string => {
  if (Number.isInteger(num)) return num.toString()
  return num.toFixed(1)
}

/* -------------------------------------------------------------------------- */
/* Tooltip                                                                     */
/* -------------------------------------------------------------------------- */

interface ChartTooltipPayloadItem {
  category: string
  value: number
  name: string
  color: AvailableChartColorsKeys
}

interface ChartTooltipProps {
  active: boolean | undefined
  payload: ChartTooltipPayloadItem[]
  label: string
  valueFormatter: (value: number) => string
}

const ChartTooltip = ({
  active,
  payload,
  label,
  valueFormatter,
}: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-gray-200 bg-white text-sm shadow-md dark:border-gray-800 dark:bg-gray-950">
        <div className="border-inherit border-b px-4 py-2">
          <p className="font-medium text-gray-900 dark:text-gray-50">{label}</p>
        </div>
        <div className="space-y-1 px-4 py-2">
          {payload.map(({ value, name, color }, index) => (
            <div
              key={`id-${index}`}
              className="flex items-center justify-between space-x-8"
            >
              <div className="flex items-center space-x-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    getColorClassName(color, "fill").replace("fill-", "bg-"),
                  )}
                />
                <p className="whitespace-nowrap text-right text-gray-700 dark:text-gray-300">
                  {name}
                </p>
              </div>
              <p className="whitespace-nowrap text-right font-medium text-gray-900 tabular-nums dark:text-gray-50">
                {valueFormatter(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

/* -------------------------------------------------------------------------- */
/* Legend                                                                     */
/* -------------------------------------------------------------------------- */

interface LegendItemProps {
  name: string
  color: AvailableChartColorsKeys
  onClick?: (name: string, color: AvailableChartColorsKeys) => void
  activeLegend?: string
}

const LegendItem = ({
  name,
  color,
  onClick,
  activeLegend,
}: LegendItemProps) => {
  const hasOnValueChange = !!onClick
  const isDimmed = !!activeLegend && activeLegend !== name
  return (
    <li
      className={cn(
        "group inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-1 transition",
        hasOnValueChange
          ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
          : "cursor-default",
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(name, color)
      }}
    >
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          getColorClassName(color, "fill").replace("fill-", "bg-"),
          isDimmed ? "opacity-40" : "opacity-100",
        )}
        aria-hidden={true}
      />
      <p
        className={cn(
          "truncate whitespace-nowrap text-xs text-gray-700 dark:text-gray-300",
          hasOnValueChange &&
            "group-hover:text-gray-900 dark:group-hover:text-gray-50",
          isDimmed ? "opacity-40" : "opacity-100",
        )}
      >
        {name}
      </p>
    </li>
  )
}

interface LegendProps {
  categories: string[]
  colors: AvailableChartColorsKeys[]
  onClickLegendItem?: (category: string, color: string) => void
  activeLegend?: string
}

const Legend = ({
  categories,
  colors,
  onClickLegendItem,
  activeLegend,
}: LegendProps) => (
  <ol className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
    {categories.map((category, index) => (
      <LegendItem
        key={`item-${index}`}
        name={category}
        color={colors[index] ?? "gray"}
        onClick={onClickLegendItem as LegendItemProps["onClick"]}
        activeLegend={activeLegend}
      />
    ))}
  </ol>
)

/* -------------------------------------------------------------------------- */
/* Componente                                                                  */
/* -------------------------------------------------------------------------- */

const ScatterChartTremor = React.forwardRef<
  HTMLDivElement,
  ScatterChartTremorProps
>((props, ref) => {
  const {
    data = [],
    category,
    x,
    y,
    size,
    colors = [...AvailableChartColors],
    sizeRange = [60, 500],
    valueFormatter = formatNumber,
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

  // Categorias únicas (cada uma vira uma cor/série) na ORDEM DE APARIÇÃO.
  const categories = React.useMemo(
    () => Array.from(new Set(data.map((d) => String(d[category])))),
    [data, category],
  )

  const categoryColors = React.useMemo(
    () => constructCategoryColors(categories, colors),
    [categories, colors],
  )

  // Estado: legenda ativa (item clicado → dim outras categorias).
  const [activeLegend, setActiveLegend] = React.useState<string | undefined>(
    undefined,
  )

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
        <ReChartsScatterChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          {showGridLines ? (
            <CartesianGrid
              className="stroke-1 stroke-gray-200 dark:stroke-gray-800"
              horizontal={true}
              vertical={true}
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
            className="fill-gray-500 text-xs dark:fill-gray-500"
            tickLine={false}
            axisLine={false}
            minTickGap={5}
            tickFormatter={valueFormatter}
          />
          <YAxis
            width={yAxisWidth}
            hide={!showYAxis}
            type="number"
            name={y}
            dataKey={y}
            tick={{ transform: "translate(-3, 0)" }}
            tickFormatter={valueFormatter}
            fill=""
            stroke=""
            className="fill-gray-500 text-xs dark:fill-gray-500"
            tickLine={false}
            axisLine={false}
            allowDecimals={true}
          />
          {size ? (
            <ZAxis
              type="number"
              dataKey={size}
              range={sizeRange}
              name={size}
            />
          ) : null}
          <Tooltip
            wrapperStyle={{ outline: "none" }}
            isAnimationActive={false}
            cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              const cleanPayload: ChartTooltipPayloadItem[] = payload
                ? payload.map((item) => {
                    const raw = (item.payload ?? {}) as Record<string, unknown>
                    const cat = String(raw[category] ?? "")
                    return {
                      category: cat,
                      value: Number(item.value ?? 0),
                      name: String(item.name ?? ""),
                      color:
                        (categoryColors.get(cat) ?? "gray") as AvailableChartColorsKeys,
                    }
                  })
                : []
              return showLegend && active ? (
                <ChartTooltip
                  active={active}
                  payload={cleanPayload}
                  label={String(label)}
                  valueFormatter={valueFormatter}
                />
              ) : null
            }}
          />
          {showLegend ? (
            <RechartsLegend
              verticalAlign="top"
              height={36}
              content={() => (
                <div className="mb-2 flex items-center justify-end">
                  <Legend
                    categories={categories}
                    colors={categories.map(
                      (c) =>
                        (categoryColors.get(c) ??
                          "gray") as AvailableChartColorsKeys,
                    )}
                    onClickLegendItem={handleClickLegendItem}
                    activeLegend={activeLegend}
                  />
                </div>
              )}
            />
          ) : null}
          {categories.map((cat) => {
            const colorKey = (categoryColors.get(cat) ??
              "gray") as AvailableChartColorsKeys
            const seriesData = data.filter((d) => String(d[category]) === cat)
            return (
              <Scatter
                key={cat}
                className={cn(
                  getColorClassName(colorKey, "fill"),
                  getColorClassName(colorKey, "stroke"),
                )}
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
})

ScatterChartTremor.displayName = "ScatterChartTremor"

export { ScatterChartTremor }
