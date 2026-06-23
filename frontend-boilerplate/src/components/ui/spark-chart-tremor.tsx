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
 *
 * Cor ÚNICA (Turno 5 — `accent`/`style` global): aceita `accent` (string
 * DS enum ou classe Tailwind) e/ou `style` (CSSProperties) para forçar uma
 * cor custom (hex/rgb/hsl/gradient) em vez do `var(--chart-1)` padrão.
 * Quando `style` vier, é aplicado:
 *  - no container do chart (afeta `currentColor` herdado);
 *  - no `<linearGradient>` (`style={{ color: barStyle.color ?? 'var(--chart-1)' }}`)
 *    — o `<stop stopColor="currentColor">` herda do container e o gradiente
 *    usa a cor custom.
 * Quando `accent` vier (sem style), é montado um style interno com
 * `color: 'var(--chart-N)'` (derivado do enum DS) para que o gradiente
 * acompanhe. Cobre:
 *   - `accent: 'chart-2'` → gradiente usa `var(--chart-2)`
 *   - `style: { color: '#ff0000' }` → gradiente usa `#ff0000`
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
  /**
   * Acento de cor para o spark. Aceita enum DS ('chart-1'..'chart-5' |
   * 'primary') validado pelo schema, ou classe Tailwind (`bg-chart-2`),
   * ou cor CSS (`#ff0000`, `var(--chart-1)`). Default: undefined →
   * usa `--chart-1` (paleta padrão).
   */
  accent?: string
  /**
   * Estilo inline GLOBAL aplicado ao container + `<linearGradient>`.
   * VENCE `accent`. Use para cores CSS custom (hex/rgb/hsl/gradient)
   * que NÃO existem no enum do DS. Cobre:
   *   - `style: { color: '#ff0000' }` → gradiente usa `#ff0000`
   *   - `style: { color: 'linear-gradient(...)' }` → gradiente gradient
   */
  style?: React.CSSProperties
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
 * Resolve o `color` do `<linearGradient>` (CSS var ou cor custom) a partir
 * de `style` (vence) e `accent` (fallback). Aceita:
 *   - `accent: 'chart-2'` (bare enum) → `var(--chart-2)`
 *   - `accent: 'bg-chart-2'` (classe Tailwind) → `var(--chart-2)`
 *   - `accent: 'primary'` → `var(--primary)` (não-cíclica; raramente usado)
 *   - `style: { color: '#ff0000' }` → `#ff0000` (custom, vence accent)
 *   - qualquer outra string → usada como CSS color crua (ex.: `'#abc'`)
 *   - undefined → `var(--chart-1)` (default DS).
 */
const resolveGradientColor = (
  accent: string | undefined,
  styleColor: string | undefined,
): string => {
  if (styleColor) return styleColor
  if (accent) {
    const bare = accent.replace(/^(bg-|fill-|stroke-)/, "").trim()
    // Enum DS → CSS var do tema.
    if (/^chart-[1-5]$/.test(bare)) return `var(--${bare})`
    if (bare === "primary") return "var(--primary)"
    // Senão, devolve como CSS color crua (hex/rgb/oklch/gradient).
    return bare
  }
  return "var(--chart-1)"
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
      accent,
      style,
      ...other
    } = props
    // Consome `colors` uma vez para o TS saber que existe e não reclamar.
    void (props as { colors?: AvailableChartColorsKeys[] }).colors

    const chartData = toChartData(data)
    const [yMin, yMax] = yAxisDomain(data)
    const gradientId = React.useId()

    // Cor do gradient (resolvida por accent/style). Aplicada no container
    // via `style={{ color: ... }}` — o `<stop stopColor="currentColor">`
    // herda do container (corrente), então o gradiente usa a cor custom
    // sem precisar de classe Tailwind interpolada.
    // Ordem do merge: `style` do consumer VENCE; `gradientColor` é só o
    // fallback quando `style.color` não foi setado.
    const containerStyle: React.CSSProperties = {
      ...style,
      color: style?.color ?? resolveGradientColor(accent, undefined),
    }
    // Para o line/bar (sem gradient), classes Tailwind derivadas do accent:
    // enum DS → `stroke-chart-N` / `fill-chart-N`; senão, sem classe (style cuida).
    let strokeClass = "stroke-chart-1"
    let fillClass = "fill-chart-1"
    if (accent) {
      const bare = accent.replace(/^(bg-|fill-|stroke-)/, "").trim()
      if (/^chart-[1-5]$/.test(bare)) {
        strokeClass = `stroke-${bare}`
        fillClass = `fill-${bare}`
      } else if (bare === "primary") {
        strokeClass = "stroke-primary"
        fillClass = "fill-primary"
      } else {
        // Cor custom → deixa só o style inline cuidar (zera as classes).
        strokeClass = ""
        fillClass = ""
      }
    }

    const commonMargin = { bottom: 1, left: 1, right: 1, top: 1 }
    const gradientColor = containerStyle.color as string

    return (
      <div
        ref={forwardedRef}
        className={cn("h-12 w-28", className)}
        data-slot="spark-chart-tremor"
        tremor-id="tremor-raw"
        // `style` global no container: propaga `color` para o gradiente
        // (via `currentColor`) e qualquer outra prop (ex.: `opacity`,
        // `transform`). `color` do consumer VENCE (em `containerStyle`
        // acima); senão usa o accent resolvido.
        style={containerStyle}
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
                    // `style` no gradient propaga `color` (resolvida acima)
                    // para os <stop> via `currentColor` — sem precisar de
                    // classe Tailwind interpolada (que o JIT não geraria).
                    style={{ color: gradientColor }}
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
