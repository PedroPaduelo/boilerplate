import * as React from "react"
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react"
import {
  Area,
  CartesianGrid,
  Dot,
  Label,
  Line,
  AreaChart as ReChartsAreaChart,
  Legend as ReChartsLegend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { AxisDomain } from "recharts/types/util/types"

import {
  AvailableChartColors,
  type AvailableChartColorsKeys,
  constructCategoryColors,
  cx,
  getColorClassName,
  getYAxisDomain,
} from "@/shared/lib/tremor-utils"

// ────────────────────────────────────────────────────────────────────────────
// Helpers locais
// ────────────────────────────────────────────────────────────────────────────

/** Cor Tremor → classe Tailwind `bg-<x>-500` (usada no dot da legend / tooltip). */
const getBgClass = (color: AvailableChartColorsKeys) =>
  `bg-${color}-500` as const

/** Cor Tremor → classe Tailwind `text-<x>-500` (usada no gradient via `currentColor`). */
const getTextClass = (color: AvailableChartColorsKeys) =>
  `text-${color}-500` as const

/** Detecta se uma chave tem um único valor único em toda a série. */
const hasOnlyOneValueForKey = (
  data: Record<string, unknown>[],
  key: string,
): boolean => {
  if (!data || data.length === 0) return true
  const first = data[0][key]
  for (let i = 1; i < data.length; i++) {
    if (data[i][key] !== first) return false
  }
  return true
}

// ────────────────────────────────────────────────────────────────────────────
// Legend (interativa, com scroll horizontal opcional)
// ────────────────────────────────────────────────────────────────────────────

interface LegendItemProps {
  name: string
  color: AvailableChartColorsKeys
  onClick?: (name: string, color: AvailableChartColorsKeys) => void
  activeLegend?: string
}

const LegendItem = ({ name, color, onClick, activeLegend }: LegendItemProps) => {
  const hasOnValueChange = !!onClick
  return (
    <li
      className={cx(
        "group inline-flex flex-nowrap items-center gap-1.5 rounded-sm px-2 py-1 whitespace-nowrap transition",
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
        className={cx(
          "h-[3px] w-3.5 shrink-0 rounded-full",
          getBgClass(color),
          activeLegend && activeLegend !== name ? "opacity-40" : "opacity-100",
        )}
        aria-hidden={true}
      />
      <p
        className={cx(
          "truncate text-xs whitespace-nowrap text-gray-700 dark:text-gray-300",
          hasOnValueChange &&
            "group-hover:text-gray-900 dark:group-hover:text-gray-50",
          activeLegend && activeLegend !== name ? "opacity-40" : "opacity-100",
        )}
      >
        {name}
      </p>
    </li>
  )
}

interface ScrollButtonProps {
  icon: LucideIcon
  onClick?: () => void
  disabled?: boolean
}

const ScrollButton = ({
  icon: Icon,
  onClick,
  disabled,
}: ScrollButtonProps): React.ReactElement => {
  const [isPressed, setIsPressed] = React.useState(false)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    if (isPressed) {
      intervalRef.current = setInterval(() => onClick?.(), 300)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPressed, onClick])

  React.useEffect(() => {
    if (disabled && intervalRef.current) {
      clearInterval(intervalRef.current)
      setIsPressed(false)
    }
  }, [disabled])

  return (
    <button
      type="button"
      className={cx(
        "group inline-flex size-5 items-center truncate rounded-sm transition",
        disabled
          ? "cursor-not-allowed text-gray-400 dark:text-gray-600"
          : "cursor-pointer text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50",
      )}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        setIsPressed(true)
      }}
      onMouseUp={(e) => {
        e.stopPropagation()
        setIsPressed(false)
      }}
    >
      <Icon className="size-full" aria-hidden="true" />
    </button>
  )
}

interface LegendProps extends React.OlHTMLAttributes<HTMLOListElement> {
  categories: string[]
  colors?: AvailableChartColorsKeys[]
  onClickLegendItem?: (category: string, color: string) => void
  activeLegend?: string
  enableLegendSlider?: boolean
}

type HasScrollProps = { left: boolean; right: boolean }

const Legend = React.forwardRef<HTMLOListElement, LegendProps>((props, ref) => {
  const {
    categories,
    colors = AvailableChartColors,
    className,
    onClickLegendItem,
    activeLegend,
    enableLegendSlider = false,
    ...other
  } = props
  const scrollableRef = React.useRef<HTMLDivElement>(null)
  const [hasScroll, setHasScroll] = React.useState<HasScrollProps | null>(null)
  const [isKeyDowned, setIsKeyDowned] = React.useState<string | null>(null)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const checkScroll = React.useCallback(() => {
    const scrollable = scrollableRef.current
    if (!scrollable) return
    const hasLeftScroll = scrollable.scrollLeft > 0
    const hasRightScroll =
      scrollable.scrollWidth - scrollable.clientWidth > scrollable.scrollLeft
    setHasScroll({ left: hasLeftScroll, right: hasRightScroll })
  }, [])

  const scrollToTest = React.useCallback(
    (direction: "left" | "right") => {
      const element = scrollableRef.current
      if (element && enableLegendSlider) {
        const width = element.clientWidth ?? 0
        element.scrollTo({
          left:
            direction === "left"
              ? element.scrollLeft - width
              : element.scrollLeft + width,
          behavior: "smooth",
        })
        setTimeout(checkScroll, 400)
      }
    },
    [enableLegendSlider, checkScroll],
  )

  React.useEffect(() => {
    const keyDownHandler = (key: string) => {
      if (key === "ArrowLeft") scrollToTest("left")
      else if (key === "ArrowRight") scrollToTest("right")
    }
    if (isKeyDowned) {
      keyDownHandler(isKeyDowned)
      intervalRef.current = setInterval(() => keyDownHandler(isKeyDowned), 300)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isKeyDowned, scrollToTest])

  React.useEffect(() => {
    const scrollable = scrollableRef.current
    const keyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault()
        setIsKeyDowned(e.key)
      }
    }
    const keyUp = () => setIsKeyDowned(null)
    if (enableLegendSlider) {
      checkScroll()
      scrollable?.addEventListener("keydown", keyDown)
      scrollable?.addEventListener("keyup", keyUp)
    }
    return () => {
      scrollable?.removeEventListener("keydown", keyDown)
      scrollable?.removeEventListener("keyup", keyUp)
    }
  }, [checkScroll, enableLegendSlider])

  return (
    <ol
      ref={ref}
      className={cx("relative overflow-hidden", className)}
      {...other}
    >
      <div
        ref={scrollableRef}
        tabIndex={0}
        className={cx(
          "flex h-full",
          enableLegendSlider
            ? hasScroll?.right || hasScroll?.left
              ? "snap-mandatory items-center overflow-auto pr-12 pl-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : ""
            : "flex-wrap",
        )}
      >
        {categories.map((category, index) => (
          <LegendItem
            key={`item-${index}`}
            name={category}
            color={colors[index] as AvailableChartColorsKeys}
            onClick={onClickLegendItem}
            activeLegend={activeLegend}
          />
        ))}
      </div>
      {enableLegendSlider && (hasScroll?.right || hasScroll?.left) ? (
        <div
          className={cx(
            "absolute top-0 right-0 bottom-0 flex h-full items-center justify-center pr-1 bg-white dark:bg-gray-950",
          )}
        >
          <ScrollButton
            icon={ChevronLeft}
            onClick={() => {
              setIsKeyDowned(null)
              scrollToTest("left")
            }}
            disabled={!hasScroll?.left}
          />
          <ScrollButton
            icon={ChevronRight}
            onClick={() => {
              setIsKeyDowned(null)
              scrollToTest("right")
            }}
            disabled={!hasScroll?.right}
          />
        </div>
      ) : null}
    </ol>
  )
})
Legend.displayName = "Legend"

const ChartLegend = (
  { payload }: { payload: Array<{ value: string; type: string }> },
  categoryColors: Map<string, AvailableChartColorsKeys>,
  setLegendHeight: React.Dispatch<React.SetStateAction<number>>,
  activeLegend: string | undefined,
  onClick?: (category: string, color: string) => void,
  enableLegendSlider?: boolean,
  legendPosition?: "left" | "center" | "right",
  yAxisWidth?: number,
) => {
  const legendRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const calculateHeight = (height: number | undefined) =>
      height ? Number(height) + 15 : 60
    setLegendHeight(calculateHeight(legendRef.current?.clientHeight))
  }, [setLegendHeight])

  const legendPayload = payload.filter((item) => item.type !== "none")
  const paddingLeft = legendPosition === "left" && yAxisWidth ? yAxisWidth - 8 : 0

  return (
    <div
      ref={legendRef}
      style={{ paddingLeft }}
      className={cx(
        "flex items-center",
        legendPosition === "center" && "justify-center",
        legendPosition === "left" && "justify-start",
        legendPosition === "right" && "justify-end",
      )}
    >
      <Legend
        categories={legendPayload.map((entry) => entry.value)}
        colors={legendPayload.map(
          (entry) => categoryColors.get(entry.value) as AvailableChartColorsKeys,
        )}
        onClickLegendItem={onClick}
        activeLegend={activeLegend}
        enableLegendSlider={enableLegendSlider}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Tooltip
// ────────────────────────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  category: string
  value: number
  index: string
  color: AvailableChartColorsKeys
  type?: string
  payload: unknown
}

export interface AreaChartTooltipProps {
  active: boolean | undefined
  payload: TooltipPayloadItem[]
  label: string
}

interface ChartTooltipProps extends AreaChartTooltipProps {
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
      <div
        className={cx(
          "rounded-md border text-sm shadow-md border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950",
        )}
      >
        <div className="border-b border-inherit px-4 py-2">
          <p className="font-medium text-gray-900 dark:text-gray-50">{label}</p>
        </div>
        <div className="space-y-1 px-4 py-2">
          {payload.map(({ value, category, color }, index) => (
            <div
              key={`id-${index}`}
              className="flex items-center justify-between space-x-8"
            >
              <div className="flex items-center space-x-2">
                <span
                  aria-hidden="true"
                  className={cx(
                    "h-[3px] w-3.5 shrink-0 rounded-full",
                    getBgClass(color),
                  )}
                />
                <p className="text-right whitespace-nowrap text-gray-700 dark:text-gray-300">
                  {category}
                </p>
              </div>
              <p className="text-right font-medium whitespace-nowrap tabular-nums text-gray-900 dark:text-gray-50">
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

// ────────────────────────────────────────────────────────────────────────────
// AreaChart
// ────────────────────────────────────────────────────────────────────────────

interface ActiveDot {
  index?: number
  dataKey?: string
}

type BaseEventProps = {
  eventType: "dot" | "category"
  categoryClicked: string
  [key: string]: number | string
}

export type AreaChartEventProps = BaseEventProps | null | undefined

export interface AreaChartTremorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, unknown>[]
  index: string
  categories: string[]
  colors?: AvailableChartColorsKeys[]
  valueFormatter?: (value: number) => string
  startEndOnly?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  showGridLines?: boolean
  yAxisWidth?: number
  intervalType?: "preserveStartEnd" | "equidistantPreserveStart"
  showTooltip?: boolean
  showLegend?: boolean
  autoMinValue?: boolean
  minValue?: number
  maxValue?: number
  allowDecimals?: boolean
  onValueChange?: (value: AreaChartEventProps) => void
  enableLegendSlider?: boolean
  tickGap?: number
  connectNulls?: boolean
  xAxisLabel?: string
  yAxisLabel?: string
  type?: "default" | "stacked" | "percent"
  legendPosition?: "left" | "center" | "right"
  fill?: "gradient" | "solid" | "none"
  showAnimation?: boolean
  customTooltip?: React.ComponentType<AreaChartTooltipProps>
}

const AreaChartTremor = React.forwardRef<HTMLDivElement, AreaChartTremorProps>(
  (props, ref) => {
    const {
      data = [],
      categories = [],
      index,
      colors = AvailableChartColors,
      valueFormatter = (value: number) => value.toString(),
      startEndOnly = false,
      showXAxis = true,
      showYAxis = true,
      showGridLines = true,
      yAxisWidth = 56,
      intervalType = "equidistantPreserveStart",
      showTooltip = true,
      showLegend = true,
      autoMinValue = false,
      minValue,
      maxValue,
      allowDecimals = true,
      connectNulls = false,
      className,
      onValueChange,
      enableLegendSlider = false,
      tickGap = 5,
      xAxisLabel,
      yAxisLabel,
      type = "default",
      legendPosition = "right",
      fill = "gradient",
      showAnimation = true,
      customTooltip,
      ...other
    } = props
    const CustomTooltip = customTooltip
    const paddingValue =
      (!showXAxis && !showYAxis) || (startEndOnly && !showYAxis) ? 0 : 20
    const [legendHeight, setLegendHeight] = React.useState(60)
    const [activeDot, setActiveDot] = React.useState<ActiveDot | undefined>(
      undefined,
    )
    const [activeLegend, setActiveLegend] = React.useState<string | undefined>(
      undefined,
    )
    const categoryColors = constructCategoryColors(
      categories,
      colors ? [...colors] : [...AvailableChartColors],
    )

    // Domínio do eixo Y: derivamos dos valores efetivos das séries (exceto
    // quando `minValue`/`maxValue`/`autoMinValue` foram passados).
    const allValues = React.useMemo(() => {
      if (minValue !== undefined && maxValue !== undefined) {
        return [minValue, maxValue]
      }
      const values: number[] = []
      for (const row of data) {
        for (const cat of categories) {
          const v = row[cat]
          if (typeof v === "number") values.push(v)
        }
      }
      return values
    }, [data, categories, minValue, maxValue])

    const yAxisDomain = React.useMemo<
      [number | "auto", number | "auto"]
    >(() => {
      if (minValue !== undefined && maxValue !== undefined) {
        return [minValue, maxValue]
      }
      if (autoMinValue && minValue === undefined) {
        // autoMinValue: deixa o recharts decidir o mínimo a partir dos dados.
        return [0, "auto"]
      }
      return getYAxisDomain(allValues)
    }, [allValues, autoMinValue, minValue, maxValue])

    const hasOnValueChange = !!onValueChange
    const stacked = type === "stacked" || type === "percent"
    const areaId = React.useId()

    const getFillContent = ({
      fillType,
      activeDot,
      activeLegend,
      category,
    }: {
      fillType: AreaChartTremorProps["fill"]
      activeDot: ActiveDot | undefined
      activeLegend: string | undefined
      category: string
    }) => {
      const stopOpacity =
        activeDot || (activeLegend && activeLegend !== category) ? 0.1 : 0.3

      switch (fillType) {
        case "none":
          return <stop stopColor="currentColor" stopOpacity={0} />
        case "gradient":
          return (
            <>
              <stop
                offset="5%"
                stopColor="currentColor"
                stopOpacity={stopOpacity}
              />
              <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
            </>
          )
        case "solid":
        default:
          return <stop stopColor="currentColor" stopOpacity={stopOpacity} />
      }
    }

    const valueToPercent = (value: number) => `${(value * 100).toFixed(0)}%`

    function onDotClick(
      itemData: { index?: number; dataKey?: string; payload?: unknown },
      event: React.MouseEvent,
    ) {
      event.stopPropagation()
      if (!hasOnValueChange) return
      if (
        (itemData.index === activeDot?.index &&
          itemData.dataKey === activeDot?.dataKey) ||
        (hasOnlyOneValueForKey(data, itemData.dataKey as string) &&
          activeLegend &&
          activeLegend === itemData.dataKey)
      ) {
        setActiveLegend(undefined)
        setActiveDot(undefined)
        onValueChange?.(null)
      } else {
        setActiveLegend(itemData.dataKey)
        setActiveDot({ index: itemData.index, dataKey: itemData.dataKey })
        onValueChange?.({
          eventType: "dot",
          categoryClicked: itemData.dataKey as string,
          ...((itemData.payload as Record<string, number | string>) ?? {}),
        })
      }
    }

    function onCategoryClick(dataKey: string) {
      if (!hasOnValueChange) return
      if (
        (dataKey === activeLegend && !activeDot) ||
        (hasOnlyOneValueForKey(data, dataKey) &&
          activeDot &&
          activeDot.dataKey === dataKey)
      ) {
        setActiveLegend(undefined)
        onValueChange?.(null)
      } else {
        setActiveLegend(dataKey)
        onValueChange?.({ eventType: "category", categoryClicked: dataKey })
      }
      setActiveDot(undefined)
    }

    return (
      <div
        ref={ref}
        className={cx("h-80 w-full", className)}
        tremor-id="tremor-raw"
        data-slot="area-chart-tremor"
        {...other}
      >
        <ResponsiveContainer>
          <ReChartsAreaChart
            data={data as Record<string, unknown>[]}
            onClick={
              hasOnValueChange && (activeLegend || activeDot)
                ? () => {
                    setActiveDot(undefined)
                    setActiveLegend(undefined)
                    onValueChange?.(null)
                  }
                : undefined
            }
            margin={{
              bottom: xAxisLabel ? 30 : undefined,
              left: yAxisLabel ? 20 : undefined,
              right: yAxisLabel ? 5 : undefined,
              top: 5,
            }}
            stackOffset={type === "percent" ? "expand" : undefined}
          >
            {showGridLines ? (
              <CartesianGrid
                className="stroke-gray-200 stroke-1 dark:stroke-gray-800"
                horizontal={true}
                vertical={false}
              />
            ) : null}
            <XAxis
              padding={{ left: paddingValue, right: paddingValue }}
              hide={!showXAxis}
              dataKey={index}
              interval={startEndOnly ? "preserveStartEnd" : intervalType}
              tick={{ transform: "translate(0, 6)" }}
              ticks={
                startEndOnly && data.length > 0
                  ? ([data[0][index], data[data.length - 1][index]] as Array<
                      string | number
                    >)
                  : undefined
              }
              fill=""
              stroke=""
              className="text-xs fill-gray-500 dark:fill-gray-500"
              tickLine={false}
              axisLine={false}
              minTickGap={tickGap}
            >
              {xAxisLabel && (
                <Label
                  position="insideBottom"
                  offset={-20}
                  className="fill-gray-800 text-sm font-medium dark:fill-gray-200"
                >
                  {xAxisLabel}
                </Label>
              )}
            </XAxis>
            <YAxis
              width={yAxisWidth}
              hide={!showYAxis}
              axisLine={false}
              tickLine={false}
              type="number"
              domain={yAxisDomain as AxisDomain}
              tick={{ transform: "translate(-3, 0)" }}
              fill=""
              stroke=""
              className="text-xs fill-gray-500 dark:fill-gray-500"
              tickFormatter={
                type === "percent" ? valueToPercent : valueFormatter
              }
              allowDecimals={allowDecimals}
            >
              {yAxisLabel && (
                <Label
                  position="insideLeft"
                  style={{ textAnchor: "middle" }}
                  angle={-90}
                  offset={-15}
                  className="fill-gray-800 text-sm font-medium dark:fill-gray-200"
                >
                  {yAxisLabel}
                </Label>
              )}
            </YAxis>
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              isAnimationActive={showAnimation}
              animationDuration={100}
              cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
              offset={20}
              position={{ y: 0 }}
              content={({ active, payload, label }) => {
                const cleanPayload: TooltipPayloadItem[] = payload
                  ? (payload as Array<{
                      dataKey?: string
                      value?: number
                      payload?: Record<string, unknown>
                      type?: string
                    }>).map((item) => ({
                      category: item.dataKey ?? "",
                      value: typeof item.value === "number" ? item.value : 0,
                      index: String(item.payload?.[index] ?? ""),
                      color:
                        categoryColors.get(item.dataKey ?? "") ??
                        ("gray" as AvailableChartColorsKeys),
                      type: item.type,
                      payload: item.payload,
                    }))
                  : []

                if (!showTooltip || !active) return null

                return CustomTooltip ? (
                  <CustomTooltip
                    active={active}
                    payload={cleanPayload}
                    label={String(label ?? "")}
                  />
                ) : (
                  <ChartTooltip
                    active={active}
                    payload={cleanPayload}
                    label={String(label ?? "")}
                    valueFormatter={valueFormatter}
                  />
                )
              }}
            />

            {showLegend ? (
              <ReChartsLegend
                verticalAlign="top"
                height={legendHeight}
                content={({ payload }: { payload?: ReadonlyArray<{ value?: unknown; type?: string }> }) =>
                  ChartLegend(
                    {
                      payload: (
                        (payload ?? []) as Array<{ value: string; type: string }>
                      ).map((p) => ({
                        value: String(p.value ?? ""),
                        type: p.type ?? "",
                      })),
                    },
                    categoryColors,
                    setLegendHeight,
                    activeLegend,
                    hasOnValueChange
                      ? (clickedLegendItem: string) =>
                          onCategoryClick(clickedLegendItem)
                      : undefined,
                    enableLegendSlider,
                    legendPosition,
                    yAxisWidth,
                  )
                }
              />
            ) : null}
            {/* defs (gradientes) separados das <Area> — recharts 2.x + React 19
                só detecta as séries quando <Area> é filha DIRETA do AreaChart
                (não pode estar embrulhada em <React.Fragment>). */}
            <defs>
              {categories.map((category) => {
                const categoryId = `${areaId}-${category.replace(/[^a-zA-Z0-9]/g, "")}`
                const categoryColor =
                  categoryColors.get(category) ??
                  ("gray" as AvailableChartColorsKeys)
                return (
                  <linearGradient
                    key={category}
                    className={getTextClass(categoryColor)}
                    id={categoryId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    {getFillContent({
                      fillType: fill,
                      activeDot,
                      activeLegend,
                      category,
                    })}
                  </linearGradient>
                )
              })}
            </defs>
            {categories.map((category) => {
              const categoryId = `${areaId}-${category.replace(/[^a-zA-Z0-9]/g, "")}`
              const categoryColor =
                categoryColors.get(category) ??
                ("gray" as AvailableChartColorsKeys)
              return (
                  <Area
                    className={getColorClassName(categoryColor, "stroke")}
                    strokeOpacity={
                      activeDot || (activeLegend && activeLegend !== category)
                        ? 0.3
                        : 1
                    }
                    activeDot={(dotProps: {
                      cx?: number
                      cy?: number
                      stroke?: string
                      strokeLinecap?: "inherit" | "round" | "butt" | "square"
                      strokeLinejoin?: "inherit" | "round" | "bevel" | "miter"
                      strokeWidth?: number
                      dataKey?: string
                    }) => {
                      const {
                        cx: cxCoord,
                        cy: cyCoord,
                        stroke,
                        strokeLinecap,
                        strokeLinejoin,
                        strokeWidth,
                        dataKey,
                      } = dotProps
                      return (
                        <Dot
                          className={cx(
                            "stroke-white dark:stroke-gray-950",
                            onValueChange ? "cursor-pointer" : "",
                            getColorClassName(
                              categoryColors.get(dataKey as string) ??
                                ("gray" as AvailableChartColorsKeys),
                              "fill",
                            ),
                          )}
                          cx={cxCoord}
                          cy={cyCoord}
                          r={5}
                          fill=""
                          stroke={stroke}
                          strokeLinecap={strokeLinecap}
                          strokeLinejoin={strokeLinejoin}
                          strokeWidth={strokeWidth}
                          onClick={(_e: unknown, event: unknown) =>
                            onDotClick(
                              { dataKey, payload: undefined },
                              event as React.MouseEvent,
                            )
                          }
                        />
                      )
                    }}
                    dot={(dotProps: {
                      stroke?: string
                      strokeLinecap?: "inherit" | "round" | "butt" | "square"
                      strokeLinejoin?: "inherit" | "round" | "bevel" | "miter"
                      strokeWidth?: number
                      cx?: number
                      cy?: number
                      dataKey?: string
                      index?: number
                    }) => {
                      const {
                        stroke,
                        strokeLinecap,
                        strokeLinejoin,
                        strokeWidth,
                        cx: cxCoord,
                        cy: cyCoord,
                        dataKey,
                        index: dotIndex,
                      } = dotProps

                      if (
                        (hasOnlyOneValueForKey(data, category) &&
                          !(activeDot ||
                            (activeLegend && activeLegend !== category))) ||
                        (activeDot?.index === dotIndex &&
                          activeDot?.dataKey === category)
                      ) {
                        return (
                          <Dot
                            key={dotIndex}
                            cx={cxCoord}
                            cy={cyCoord}
                            r={5}
                            stroke={stroke}
                            fill=""
                            strokeLinecap={strokeLinecap}
                            strokeLinejoin={strokeLinejoin}
                            strokeWidth={strokeWidth}
                            className={cx(
                              "stroke-white dark:stroke-gray-950",
                              onValueChange ? "cursor-pointer" : "",
                              getColorClassName(
                                categoryColors.get(dataKey as string) ??
                                  ("gray" as AvailableChartColorsKeys),
                                "fill",
                              ),
                            )}
                          />
                        )
                      }
                      return <React.Fragment key={dotIndex} />
                    }}
                    key={category}
                    name={category}
                    type="linear"
                    dataKey={category}
                    stroke=""
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    isAnimationActive={showAnimation}
                    connectNulls={connectNulls}
                    stackId={stacked ? "stack" : undefined}
                    fill={`url(#${categoryId})`}
                  />
              )
            })}
            {/* hidden lines to increase clickable target area when onValueChange is set */}
            {onValueChange
              ? categories.map((category) => (
                  <Line
                    className="cursor-pointer"
                    strokeOpacity={0}
                    key={category}
                    name={category}
                    type="linear"
                    dataKey={category}
                    stroke="transparent"
                    fill="transparent"
                    legendType="none"
                    tooltipType="none"
                    strokeWidth={12}
                    connectNulls={connectNulls}
                    onClick={(lineProps: unknown, event: React.MouseEvent) => {
                      event.stopPropagation()
                      const { name } = lineProps as { name: string }
                      onCategoryClick(name)
                    }}
                  />
                ))
              : null}
          </ReChartsAreaChart>
        </ResponsiveContainer>
      </div>
    )
  },
)

AreaChartTremor.displayName = "AreaChartTremor"

export { AreaChartTremor }
export type { AvailableChartColorsKeys }
