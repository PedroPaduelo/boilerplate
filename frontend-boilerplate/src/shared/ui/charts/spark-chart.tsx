/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Este é o MINI-GRÁFICO do
 * card de resumo da referência (`04-widgets-prontos.md` §2.3/§2.4): o desenho
 * que acompanha um número, não um gráfico para ler valor.
 *
 * O que a referência manda o modo `sparkline` sobrepor da base (§2.3):
 *   • sem eixos, sem grade, sem legenda;
 *   • `grid.padding` de 6px em TODOS os lados → `CHART_SPARK_MARGIN`;
 *   • cor = tom **dark** da família (`primary.dark` = #007867), não a `main`;
 *   • `markers.strokeWidth: 0` — marcador sem contorno branco (o DIÂMETRO,
 *     porém, é o mesmo 6px do gráfico com eixo: o card de resumo costuma
 *     aparecer na mesma tela que a linha);
 *   • tooltip com o VALOR formatado e SEM título.
 *
 * E as três variações do mesmo padrão (§2.4), todas mantidas em `type`:
 *   • `line`  84 × 56 px — resumo de analytics (a canônica, `CHART_HEIGHT.spark`);
 *   • `bar`   60 × 40 px — resumo de app: traço 0, raio 1,5px, coluna 64%;
 *   • `area` 100 × 66 px — resumo de e-commerce: preenchimento em gradiente.
 *
 * Substitui `spark-chart-tremor.tsx`, que carregava três caminhos de cor
 * (`accent`, `style`, `multicolor`), um gradiente arco-íris e uma prop `colors`
 * mantida só por compatibilidade e ignorada. Aqui a cor é uma só, sai da paleta
 * do DS, e o rótulo acessível é OBRIGATÓRIO — sem eixos, o texto é a única
 * leitura possível para quem não vê o desenho.
 */
import { useId } from 'react';
import {
  Area,
  Bar,
  Line,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CHART_SPARK_MARGIN, chartAnimationProps } from './chart-axes';
import { formatChartValue } from './chart-data';
import { ChartFrame } from './chart-frame';
import type { ChartFrameState } from './chart-frame';
import { chartSparkMarkerProps } from './chart-marker';
import type { ChartScope } from './chart-template';
import { ChartTooltip } from './chart-tooltip';
import type { ChartStateProps, ValueFormatter } from './types';
import {
  CHART_GEOMETRY,
  CHART_HEIGHT,
  CHART_RAMP_COLORS,
  darkenColor,
  useChartPalette,
  type ChartPalette,
  type ChartRampColor,
  type ChartSeriesColor,
} from './use-chart-palette';

/** Forma do minigráfico. */
export type SparkChartType = 'area' | 'bar' | 'line';

/** Curva usada nas formas de traço (`area`, `line`). */
export type SparkChartCurve = 'linear' | 'monotone' | 'step';

export interface SparkChartProps extends Omit<ChartStateProps, 'label'> {
  /** Série de valores, na ordem temporal. */
  data: number[];
  /** Forma do minigráfico. */
  type?: SparkChartType;
  /** Cor da série. Sem isto, usa o tom `dark` da cor principal (§2.3). */
  color?: ChartSeriesColor;
  /** Altura em px. Sem isto, a altura da variante na referência (§2.4). */
  height?: number;
  /** Largura da caixa. Sem isto, ocupa a largura disponível. */
  width?: number | string;
  /** Curva suave (monotone) em vez de segmentos retos. Ignorado com `curve`. */
  isSmooth?: boolean;
  /** Curva do traço. Vence `isSmooth` quando informada. */
  curve?: SparkChartCurve;
  /**
   * Rótulo acessível — obrigatório: um spark não tem eixo nem legenda, então
   * esta é a única descrição do que a linha mostra. Aceita Markdown e
   * `{{variavel}}` (resolvidas com `scope`).
   */
  label: string;
  /** Escopo de interpolação dos textos (de `buildChartScope`). */
  scope?: ChartScope;
  /** Estado do desenho. Tem prioridade sobre `isLoading`/série vazia. */
  state?: ChartFrameState;
  /** Detalhe do erro, exibido no estado `error`. */
  errorMessage?: string;
  /** Formata o valor exibido no tooltip. */
  valueFormatter?: ValueFormatter;
}

/* --------------------------------------------------------------------------
 * O que o mini-gráfico SOBREPÕE da base (`04-widgets-prontos.md` §2.3/§2.4)
 * JÁ VIVE em `CHART_GEOMETRY`: `sparkMarkerStrokeWidth` (0), `barStrokeWidth`
 * (0), `sparkBarRadius` (1,5), `sparkBarWidth` (0,64) e `areaGradient`
 * (0.4 → 0, paradas 0 e 100).
 *
 * Havia aqui um `SPARK_SPEC` com esses mesmos seis números escritos à mão,
 * herdado de quando a base ainda não os publicava. Cópia local de token é
 * exatamente como a espessura do catálogo se despadronizou: o `chart-theme`
 * muda, a cópia não, e ninguém percebe até os dois desenhos aparecerem lado a
 * lado. Removido — o mini-gráfico lê a escala como todo mundo.
 * ------------------------------------------------------------------------ */

/**
 * Dimensões da referência por variante (`04-widgets-prontos.md` §1 e §2.4).
 * A ALTURA é o default do componente; a LARGURA fica documentada aqui e é
 * imposta por QUEM USA (nos nossos cards a caixa é fluida — ver `NOTAS.md`).
 *
 * ⚠️ Só a altura da variante `line` tem token (`CHART_HEIGHT.spark`); as
 * outras cinco medidas são números da referência sem degrau na escala. Como
 * são o DEFAULT de `height`, mexer nelas muda o efeito de uma prop pública —
 * ficam como estão, com pedido de token registrado no relatório do lote.
 */
const SPARK_SIZE: Record<SparkChartType, { width: number; height: number }> = {
  line: { width: 84, height: CHART_HEIGHT.spark }, // 84 × 56 — resumo analytics
  bar: { width: 60, height: 40 }, //                  60 × 40 — resumo app
  area: { width: 100, height: 66 }, //               100 × 66 — resumo e-commerce
};

/** Raio da coluna: só no topo (`borderRadiusApplication: 'end'`). §2.4 */
const BAR_RADIUS: [number, number, number, number] = [
  CHART_GEOMETRY.sparkBarRadius,
  CHART_GEOMETRY.sparkBarRadius,
  0,
  0,
];

/**
 * `columnWidth: '64%'` no vocabulário do recharts, que mede o VÃO entre
 * categorias em vez da largura da coluna. Derivado, não digitado.
 */
const BAR_CATEGORY_GAP = `${Math.round((1 - CHART_GEOMETRY.sparkBarWidth) * 100)}%`;

/** Posição do tom `dark` na rampa de 5 passos do tema (claro → escuro). */
const RAMP_DARK_INDEX = 3;

/**
 * A cor do mini-gráfico é o tom **dark** da família, não a `main` (§2.3):
 * `primary` → `#007867`. Sem cor escolhida, é o verde escuro do produto; com
 * cor escolhida, o passo `dark` da rampa daquela família. Famílias que já são
 * um tom escuro (`forest`, `navy`, `steel`…) não têm rampa e vão como estão.
 */
function sparkColor(palette: ChartPalette, color?: ChartSeriesColor): string {
  if (!color) return palette.chrome('primaryDark');
  const hasRamp = (CHART_RAMP_COLORS as readonly string[]).includes(color);
  return hasRamp
    ? palette.ramp(color as ChartRampColor)[RAMP_DARK_INDEX]
    : palette.colorAt(0, color);
}

/** Campos do payload do recharts que este tooltip consome. */
function readValue(entry: unknown): number {
  const value = Number(
    entry && typeof entry === 'object' ? ((entry as { value?: unknown }).value ?? 0) : 0,
  );
  return Number.isFinite(value) ? value : 0;
}

/**
 * Tooltip do mini-gráfico: o VALOR formatado e nada mais. A referência desliga
 * o título (a categoria do eixo X) e o nome da série — num spark não há eixo
 * para nomear nem segunda série para distinguir. §2.3
 */
function SparkTooltip({
  isActive,
  entries,
  format,
}: {
  isActive?: boolean;
  entries?: readonly unknown[];
  format: ValueFormatter;
}) {
  if (!isActive || !entries || entries.length === 0) return null;
  return <ChartTooltip rows={[{ label: '', value: format(readValue(entries[0])) }]} />;
}

/** Minigráfico de tendência (área, barras ou linha), sem eixos e sem grade. */
export function SparkChart({
  data,
  type = 'area',
  color,
  height,
  width = '100%',
  isSmooth = true,
  curve,
  label,
  scope,
  state,
  errorMessage,
  valueFormatter = formatChartValue,
  isLoading,
  emptyMessage,
  summary,
}: SparkChartProps) {
  const palette = useChartPalette();
  const gradientId = useId();
  const stroke = sparkColor(palette, color);
  const rows = data.map((value, index) => ({ index, value }));
  const curveType = curve ?? (isSmooth ? 'monotone' : 'linear');
  const plotHeight = height ?? SPARK_SIZE[type].height;

  /** 360ms de entrada, como todo desenho do catálogo (`02-configuracao-base` §3). */
  const animation = chartAnimationProps(palette);

  /**
   * Marcador do ponto sob o cursor: os MESMOS 6px de diâmetro do gráfico com
   * eixo, sem contorno (§2.3). A conversão diâmetro → raio era feita aqui, à
   * mão, e era a única correta do catálogo — agora vem de `chart-marker`, que
   * é o lugar onde ela vale para os quatro tipos.
   */
  const activeDot = chartSparkMarkerProps(palette, stroke);

  const tooltip = (
    <Tooltip
      // Sem eixo nem grade, um cursor desenharia a única linha do desenho.
      cursor={false}
      wrapperStyle={{ outline: 'none' }}
      content={(props) => (
        <SparkTooltip
          isActive={props.active}
          entries={props.payload ?? undefined}
          format={valueFormatter}
        />
      )}
    />
  );

  return (
    <ChartFrame
      label={label}
      scope={scope}
      summary={summary}
      height={plotHeight}
      // O respiro do mini-gráfico é o `grid.padding` de 6px de DENTRO do
      // desenho (§2.3) — o padding do card sobraria por cima dele.
      isBare
      isCompact
      state={state}
      isLoading={isLoading}
      isEmpty={rows.length === 0}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
    >
      <ResponsiveContainer width={width} height={plotHeight}>
        {type === 'bar' ? (
          <RechartsBarChart
            data={rows}
            margin={CHART_SPARK_MARGIN}
            barCategoryGap={BAR_CATEGORY_GAP}
          >
            {tooltip}
            <Bar
              dataKey="value"
              fill={stroke}
              radius={BAR_RADIUS}
              strokeWidth={palette.geometry.barStrokeWidth}
              // A referência ESCURECE no hover (`02-configuracao-base` §4).
              activeBar={{ fill: darkenColor(stroke) }}
              {...animation}
            />
          </RechartsBarChart>
        ) : type === 'line' ? (
          <RechartsLineChart data={rows} margin={CHART_SPARK_MARGIN}>
            {tooltip}
            <Line
              dataKey="value"
              type={curveType}
              stroke={stroke}
              strokeWidth={palette.geometry.sparkLineWidth}
              strokeLinecap={palette.geometry.lineCap}
              dot={false}
              activeDot={activeDot}
              {...animation}
            />
          </RechartsLineChart>
        ) : (
          <RechartsAreaChart data={rows} margin={CHART_SPARK_MARGIN}>
            <defs>
              {/* Vertical, 0.4 → 0, paradas 0 e 100 (`02-configuracao-base` §5). */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset={palette.geometry.areaGradient.from}
                  stopColor={stroke}
                  stopOpacity={palette.geometry.areaGradient.opacityFrom}
                />
                <stop
                  offset={palette.geometry.areaGradient.to}
                  stopColor={stroke}
                  stopOpacity={palette.geometry.areaGradient.opacityTo}
                />
              </linearGradient>
            </defs>
            {tooltip}
            <Area
              dataKey="value"
              type={curveType}
              stroke={stroke}
              strokeWidth={palette.geometry.sparkLineWidth}
              strokeLinecap={palette.geometry.lineCap}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={activeDot}
              {...animation}
            />
          </RechartsAreaChart>
        )}
      </ResponsiveContainer>
    </ChartFrame>
  );
}
