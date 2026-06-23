/**
 * SparkChartTremor — minigráfico de tendência (recharts) TEMATIZADO no design
 * system (Tailwind/shadcn), funcionando em light/dark.
 *
 * Originalmente importado do Tremor, usava cores HARDCODED (paleta `blue`/
 * `emerald`/..., `getColorClassName("blue","stroke")` → `stroke-blue-500`)
 * que não casavam com o tema. Esta versão troca TUDO por TOKENS do tema,
 * alinhando o visual aos demais blocos do catálogo (line_chart, area_chart,
 * bar_chart, donut, scatter_chart):
 *  - série/linha/área: paleta de chart do DS (`var(--chart-1)`),
 *    a mesma dos outros blocos;
 *  - gradiente da área: `var(--chart-1)` no `stop-color` (cor literal no
 *    `<linearGradient>`, mesma técnica do `area-chart.tsx`);
 *  - sem dependência de `tremor-utils` para cor ou domínio do eixo Y
 *    (`getColorClassName`, `tremorCx`, `getYAxisDomain`, `AvailableChartColors`).
 *
 * A prop `colors` foi mantida na API para não quebrar consumidores externos
 * (aceita a mesma forma do Tremor, `AvailableChartColorsKeys[]`), mas é
 * IGNORADA — a série sempre usa a paleta do DS. Isso é intencional e
 * documentado aqui; o bloco do catálogo nem expõe essa prop.
 */
import * as React from "react"
import {
  Area,
  Bar,
  Line,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import type { AxisDomain } from "recharts/types/util/types"

import { cn } from "@/shared/lib/utils"

// `AvailableChartColorsKeys` (de tremor-utils) aceitamos por compatibilidade
// de API, mas NÃO usamos o valor (sempre usamos a paleta do DS). Mantemos o
// import como `type` para que o nome continue disponível se alguém consultar
// os tipos do componente fora daqui.
type AvailableChartColorsKeys = string

export type SparkChartType = "area" | "bar" | "line"
export type SparkCurveType = "linear" | "monotone" | "step"

export interface SparkChartTremorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Série de valores numéricos. Defaults para `[]` quando omitido. */
  data?: number[]
  /** Variante do spark chart. Default: `"area"`. */
  type?: SparkChartType
  /**
   * @deprecated Mantido por compatibilidade de API com a versão Tremor.
   * Ignorado: a série sempre usa a paleta de chart do DS (`--chart-1`).
   */
  colors?: AvailableChartColorsKeys[]
  /** Habilita animação do Recharts. Default: `true`. */
  showAnimation?: boolean
  /** Conecta pontos com valor `null`/`NaN`. Default: `false`. */
  connectNulls?: boolean
  /** Curva usada em `type="area"` e `type="line"`. Default: `"linear"`. */
  curveType?: SparkCurveType
}

/**
 * Adapta um `number[]` simples para o shape mínimo que o Recharts aceita:
 * `[{ index: number, value: number }, …]`. Mantém a ordem dos pontos.
 */
const toChartData = (values: number[]): { index: number; value: number }[] =>
  values.map((value, index) => ({ index, value }))

/**
 * Domínio Y com folga de 20% (mesma heurística do Tremor Raw, mas local).
 * Garante altura mínima visível quando a linha é plana.
 */
const yAxisDomain = (
  values: number[],
): [number | "auto", number | "auto"] => {
  if (!values || values.length === 0) return [0, "auto"]
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) {
    return [Math.max(0, min - 1), max + 1]
  }
  const padding = (max - min) * 0.2
  const yMin = min < 0 ? min - padding : 0
  const yMax = max + padding
  return [yMin, yMax]
}

const SparkChartTremor = React.forwardRef<HTMLDivElement, SparkChartTremorProps>(
  (props, forwardedRef) => {
    // `colors` é aceito por compatibilidade mas ignorado (sempre DS palette):
    // tiramos do destructure para não disparar lint de unused, e removemos do
    // `...other` para que o consumidor não receba de volta.
    const {
      data = [],
      type = "area",
      showAnimation = true,
      connectNulls = false,
      curveType = "linear",
      className,
      ...other
    } = props
    // Consome `colors` uma vez para o TS saber que existe e não reclamar.
    void (props as { colors?: AvailableChartColorsKeys[] }).colors

    const chartData = toChartData(data)
    const [yMin, yMax] = yAxisDomain(data)
    const gradientId = React.useId()

    // Cor da série: paleta de chart do DS via CSS var.
    //   - <line>/<bar>: classe Tailwind literal `stroke-chart-1` / `fill-chart-1`
    //     (a regra CSS da classe resolve `var(--color-chart-1)` e vence o
    //     atributo de apresentação default do recharts).
    //   - <linearGradient>: precisa de cor LITERAL no `stop-color`, então usamos
    //     `var(--chart-1)` direto via `style` (mesma técnica do area-chart.tsx).
    const strokeClass = "stroke-chart-1"
    const fillClass = "fill-chart-1"

    const commonMargin = { bottom: 1, left: 1, right: 1, top: 1 }

    return (
      <div
        ref={forwardedRef}
        className={cn("h-12 w-28", className)}
        data-slot="spark-chart-tremor"
        tremor-id="tremor-raw"
        {...other}
      >
        <ResponsiveContainer>
          {(() => {
            if (type === "bar") {
              return (
                <RechartsBarChart data={chartData} margin={commonMargin}>
                  <XAxis hide dataKey="index" />
                  <YAxis hide={true} domain={[yMin, yMax] as AxisDomain} />
                  <Bar
                    className={cn(fillClass)}
                    dataKey="value"
                    isAnimationActive={showAnimation}
                  />
                </RechartsBarChart>
              )
            }

            if (type === "line") {
              return (
                <RechartsLineChart data={chartData} margin={commonMargin}>
                  <XAxis hide dataKey="index" />
                  <YAxis hide={true} domain={[yMin, yMax] as AxisDomain} />
                  <Line
                    className={cn(strokeClass)}
                    dataKey="value"
                    dot={false}
                    stroke=""
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    type={curveType}
                    isAnimationActive={showAnimation}
                    connectNulls={connectNulls}
                  />
                </RechartsLineChart>
              )
            }

            // type === "area" (default)
            const fillUrl = `url(#${gradientId})`
            return (
              <RechartsAreaChart data={chartData} margin={commonMargin}>
                <XAxis hide dataKey="index" />
                <YAxis hide={true} domain={[yMin, yMax] as AxisDomain} />
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                    // `style` no gradient propaga `stop-color` para os <stop>
                    // sem precisar de classe Tailwind (que o JIT não geraria
                    // para classes interpoladas em defs).
                    style={{ color: "var(--chart-1)" }}
                  >
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  className={cn(strokeClass)}
                  dataKey="value"
                  dot={false}
                  stroke=""
                  strokeOpacity={1}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  type={curveType}
                  isAnimationActive={showAnimation}
                  connectNulls={connectNulls}
                  fill={fillUrl}
                />
              </RechartsAreaChart>
            )
          })()}
        </ResponsiveContainer>
      </div>
    )
  },
)

SparkChartTremor.displayName = "SparkChartTremor"

export { SparkChartTremor }
