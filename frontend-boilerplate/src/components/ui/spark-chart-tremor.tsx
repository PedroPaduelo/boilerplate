/**
 * SparkChartTremor — minigráfico de tendência (recharts) TEMATIZADO no design
 * system (Tailwind/shadcn), funcionando em light/dark.
 *
 * Originalmente importado do Tremor, usava cores HARDCODED (paleta `blue`/
 * `emerald`/..., `getColorClassName("blue","stroke")` → `stroke-blue-500`)
 * que não casavam com o tema. Esta versão troca TUDO por TOKENS do tema,
 * alinhando o visual aos demais blocos do catálogo (line_chart, area_chart,
 * bar_chart, donut, scatter_chart).
 *
 * COR DA SÉRIE (ENTREGA 1 — a cor pinta o GRÁFICO, não o fundo):
 *   A cor (`accent`/`style`) é aplicada SEMPRE no traço/preenchimento da
 *   série (stroke da linha/área, fill das barras e do gradiente), NUNCA no
 *   `background` do container. O bug antigo passava a cor custom como
 *   `style.background` → pintava o fundo do card. Agora:
 *     - `accent` (enum DS `chart-1..5`/`primary`, classe `stroke-…`) → vira a
 *       cor `var(--chart-N)` aplicada via `currentColor` no container e
 *       herdada por stroke/gradiente;
 *     - `style.stroke` ou `style.color` (cor CSS custom — `#40E0D0`, rgb(),
 *       gradient) → vira `currentColor` no container; stroke/fill usam
 *       `currentColor`. `style.background` é descartado (nunca pinta o fundo).
 *
 * PALETA MULTICOLOR (ENTREGA 3 — `multicolor`):
 *   Quando `multicolor` é `true` (mapeado de `palette: 'multi'` no bloco do
 *   catálogo), a série recebe um GRADIENTE horizontal multicolor com as 5
 *   cores do DS (`var(--chart-1)` → `var(--chart-5)`) — visual "arco-íris"
 *   ao longo da largura. Aplicado ao stroke (linha/área), ao fill das barras
 *   e ao preenchimento da área (com opacidade reduzida). Nesse modo o
 *   `accent`/`style` de cor única é IGNORADO (a paleta multicolor vence).
 *
 * A prop `colors` foi mantida na API para não quebrar consumidores externos,
 * mas é IGNORADA — a cor sempre vem de `accent`/`style`/`multicolor`.
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
// de API, mas NÃO usamos o valor (a cor vem de accent/style/multicolor).
type AvailableChartColorsKeys = string

export type SparkChartType = "area" | "bar" | "line"
export type SparkCurveType = "linear" | "monotone" | "step"

/** Cores do DS usadas no gradiente multicolor (palette 'multi'). */
const MULTI_PALETTE = [1, 2, 3, 4, 5] as const

export interface SparkChartTremorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Série de valores numéricos. Defaults para `[]` quando omitido. */
  data?: number[]
  /** Variante do spark chart. Default: `"area"`. */
  type?: SparkChartType
  /**
   * @deprecated Mantido por compatibilidade de API com a versão Tremor.
   * Ignorado: a cor vem de `accent`/`style`/`multicolor`.
   */
  colors?: AvailableChartColorsKeys[]
  /** Habilita animação do Recharts. Default: `true`. */
  showAnimation?: boolean
  /** Conecta pontos com valor `null`/`NaN`. Default: `false`. */
  connectNulls?: boolean
  /** Curva usada em `type="area"` e `type="line"`. Default: `"monotone"`. */
  curveType?: SparkCurveType
  /**
   * Acento de cor da SÉRIE (não do fundo). Aceita enum DS ('chart-1'..
   * 'chart-5' | 'primary'), classe `stroke-chart-N`, ou cor CSS via `style`.
   * Default: undefined → usa `--chart-1`.
   */
  accent?: string
  /**
   * Cor CSS custom da SÉRIE. Use `stroke` ou `color` para a cor do traço/
   * preenchimento (`#40E0D0`, `rgb(...)`). `background` é IGNORADO (a cor
   * NUNCA pinta o fundo do container). VENCE `accent`.
   */
  style?: React.CSSProperties
  /**
   * (ENTREGA 3) Paleta multicolor: aplica um gradiente horizontal com as 5
   * cores do DS na série (stroke/fill). Mapeado de `palette: 'multi'` no
   * bloco do catálogo. Quando `true`, `accent`/`style` de cor única é
   * ignorado. Default: `false`.
   */
  multicolor?: boolean
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

/**
 * Resolve a COR da série (CSS color string) a partir de `accent` (fallback)
 * e `style` (vence). Usada como `currentColor` no container → herdada pelo
 * stroke/gradiente. NUNCA toca em `background`. Aceita:
 *   - `accent: 'chart-2'` (bare enum) → `var(--chart-2)`
 *   - `accent: 'stroke-chart-2'` (classe Tailwind) → `var(--chart-2)`
 *   - `accent: 'primary'` → `var(--primary)`
 *   - `style: { stroke: '#40E0D0' }` ou `{ color: '#40E0D0' }` → `#40E0D0`
 *   - qualquer outra string em accent → usada como CSS color crua
 *   - undefined → `var(--chart-1)` (default DS).
 */
const resolveSeriesColor = (
  accent: string | undefined,
  style: React.CSSProperties | undefined,
): string => {
  const custom = (style?.stroke ?? style?.color) as string | undefined
  if (custom) return custom
  if (accent) {
    const bare = accent.replace(/^(bg-|fill-|stroke-|text-)/, "").trim()
    if (/^chart-[1-5]$/.test(bare)) return `var(--${bare})`
    if (bare === "primary") return "var(--primary)"
    return bare
  }
  return "var(--chart-1)"
}

const SparkChartTremor = React.forwardRef<HTMLDivElement, SparkChartTremorProps>(
  (props, forwardedRef) => {
    // `colors` é aceito por compatibilidade mas ignorado.
    const {
      data = [],
      type = "area",
      showAnimation = true,
      connectNulls = false,
      curveType = "monotone",
      className,
      accent,
      style,
      multicolor = false,
      ...other
    } = props
    // Consome `colors` uma vez para o TS saber que existe e não reclamar.
    void (props as { colors?: AvailableChartColorsKeys[] }).colors

    const chartData = toChartData(data)
    const [yMin, yMax] = yAxisDomain(data)
    // IDs únicos para os gradientes (single vertical + multicolor).
    const gradientId = React.useId()
    const multiStrokeId = React.useId()
    const multiFillId = React.useId()

    // Cor da série (single mode). Aplicada via `currentColor` no container
    // → herdada por stroke/gradiente. NUNCA vira background.
    const seriesColor = resolveSeriesColor(accent, style)

    // Container style: descarta qualquer `background`/`stroke`/`color` do
    // consumidor (a cor da série NÃO pinta o fundo) e injeta `color` =
    // seriesColor (single) para o `currentColor`. Em multicolor, o
    // `currentColor` não é usado (stroke/fill vêm dos gradientes).
    const restStyle: React.CSSProperties = { ...style }
    delete restStyle.background
    delete restStyle.color
    delete restStyle.stroke
    const containerStyle: React.CSSProperties = multicolor
      ? restStyle
      : { ...restStyle, color: seriesColor }

    // Stroke da série: gradiente multicolor (multi) ou `currentColor` (single).
    const strokeColor = multicolor ? `url(#${multiStrokeId})` : "currentColor"

    const commonMargin = { bottom: 1, left: 1, right: 1, top: 1 }

    // <defs> do gradiente multicolor horizontal (stroke full + fill suave).
    const multiDefs = (
      <defs>
        <linearGradient id={multiStrokeId} x1="0" y1="0" x2="1" y2="0">
          {MULTI_PALETTE.map((n, i) => (
            <stop
              key={n}
              offset={`${(i / (MULTI_PALETTE.length - 1)) * 100}%`}
              stopColor={`var(--chart-${n})`}
            />
          ))}
        </linearGradient>
        <linearGradient id={multiFillId} x1="0" y1="0" x2="1" y2="0">
          {MULTI_PALETTE.map((n, i) => (
            <stop
              key={n}
              offset={`${(i / (MULTI_PALETTE.length - 1)) * 100}%`}
              stopColor={`var(--chart-${n})`}
              stopOpacity={0.25}
            />
          ))}
        </linearGradient>
      </defs>
    )

    return (
      <div
        ref={forwardedRef}
        className={cn("h-12 w-28", className)}
        data-slot="spark-chart-tremor"
        tremor-id="tremor-raw"
        // `style` no container propaga `color` (a cor da série) p/ o
        // `currentColor`. NUNCA carrega `background` (a cor pinta o gráfico,
        // não o fundo — ENTREGA 1).
        style={containerStyle}
        {...other}
      >
        <ResponsiveContainer>
          {(() => {
            if (type === "bar") {
              return (
                <RechartsBarChart data={chartData} margin={commonMargin}>
                  {multicolor && multiDefs}
                  <XAxis hide dataKey="index" />
                  <YAxis hide={true} domain={[yMin, yMax] as AxisDomain} />
                  <Bar
                    dataKey="value"
                    fill={multicolor ? `url(#${multiStrokeId})` : "currentColor"}
                    isAnimationActive={showAnimation}
                  />
                </RechartsBarChart>
              )
            }

            if (type === "line") {
              return (
                <RechartsLineChart data={chartData} margin={commonMargin}>
                  {multicolor && multiDefs}
                  <XAxis hide dataKey="index" />
                  <YAxis hide={true} domain={[yMin, yMax] as AxisDomain} />
                  <Line
                    dataKey="value"
                    dot={false}
                    stroke={strokeColor}
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
            const fillUrl = multicolor
              ? `url(#${multiFillId})`
              : `url(#${gradientId})`
            return (
              <RechartsAreaChart data={chartData} margin={commonMargin}>
                <XAxis hide dataKey="index" />
                <YAxis hide={true} domain={[yMin, yMax] as AxisDomain} />
                {multicolor ? (
                  multiDefs
                ) : (
                  <defs>
                    <linearGradient
                      id={gradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                      // `color` = cor da série → `<stop>` herda via
                      // `currentColor` (gradiente vertical com fade).
                      style={{ color: seriesColor }}
                    >
                      <stop offset="5%" stopColor="currentColor" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                )}
                <Area
                  dataKey="value"
                  dot={false}
                  stroke={strokeColor}
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
