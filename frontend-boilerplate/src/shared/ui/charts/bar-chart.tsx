/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "comparar
 * categorias": colunas agrupadas, empilhadas ou pintadas por faixa de valor.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT — `03-tipos-de-grafico.md` da referência, sobre a configuração base
 * (`02-configuracao-base.md` §7, §10 e §11)
 * ---------------------------------------------------------------------------
 *   §4 coluna simples    VERDE80, traço 0, largura 40%, tooltip SEM título
 *   §5 coluna múltipla   VERDE80 + âmbar, respiro de 2px entre as vizinhas,
 *                        legenda ligada
 *   §6 coluna empilhada  4 cores da paleta, traço 0, largura 36%, legenda à
 *                        direita
 *   §7 coluna negativa   raio 2px e cor por FAIXA de valor (`<Cell>`)
 *
 * Comum a todas, herdado da base: grade só horizontal tracejada 3, eixos sem
 * linha nem marcações, raio 4px SÓ no topo, largura 48%, hover que ESCURECE
 * (a maioria das libs clareia) e entrada de 360ms com 120ms por série.
 *
 * A cor sai sempre de `useChartPalette` — nenhum hexadecimal atravessa daqui.
 */
import type { ComponentProps, ReactElement } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  Rectangle,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import {
  CHART_MARGIN,
  Y_AXIS_WIDTH,
  chartAnimationProps,
  chartAxisProps,
  chartBarCursorProps,
  chartBarRadius,
  chartGridProps,
  chartYAxisProps,
} from './chart-axes';
import {
  CATEGORY_KEY,
  describeSeries,
  formatChartValue,
  isSeriesEmpty,
  seriesKey,
  toChartRows,
} from './chart-data';
import { CHART_GEOMETRY } from './chart-theme';
import { ChartFrame } from './chart-frame';
import { ChartLegend } from './chart-legend';
import { ChartSeriesTooltip } from './chart-series-tooltip';
import type { ChartScope } from './chart-template';
import type { ChartSeries, ChartStateProps, ValueFormatter } from './types';
import {
  CHART_HEIGHT,
  CHART_SERIES_COLORS,
  chartSeriesToken,
  darkenColor,
  useChartPalette,
  type ChartPalette,
  type ChartSeriesColor,
} from './use-chart-palette';

export interface BarChartProps extends ChartStateProps {
  /** Séries desenhadas. Uma série = barras agrupadas por categoria. */
  series: ChartSeries[];
  /** Rótulos do eixo X, um por ponto. */
  labels?: string[];
  /** Altura da plotagem em px. Default: 320px, a altura dos §4–§7. */
  height?: number;
  /** Empilha as séries na mesma coluna em vez de agrupá-las lado a lado. */
  isStacked?: boolean;
  /**
   * Cor por CATEGORIA em vez de por série. Só faz sentido com uma série —
   * é o modo "paleta multicolorida" de um ranking simples.
   */
  hasColorByCategory?: boolean;
  /**
   * Cor por FAIXA de valor (§7 — coluna negativa): quedas mais fundas em
   * âmbar, quedas rasas em ciano. Sem declarar, liga sozinho quando a série
   * única tem valor negativo.
   */
  hasColorByValue?: boolean;
  /** Linhas de grade horizontais. */
  showGrid?: boolean;
  /** Legenda série → cor abaixo da plotagem. */
  showLegend?: boolean;
  /** Formata o valor no tooltip. */
  valueFormatter?: ValueFormatter;
  /** Formata os ticks dos eixos. Sem isto, usa `valueFormatter`. */
  axisFormatter?: ValueFormatter;
  /** Escopo de `{{interpolação}}` dos textos do gráfico (`buildChartScope`). */
  scope?: ChartScope;
}

/**
 * §11 — conforme a tela encolhe, a coluna engrossa para continuar legível:
 * 48% acima de 900px, 60% abaixo disso, 80% (e raio 3) abaixo de 600px.
 */
const MEDIUM_QUERY = '(max-width: 899px)';
const NARROW_QUERY = '(max-width: 599px)';

/**
 * Larguras de coluna que a referência sobrepõe à base de 48%: §4 afina a
 * coluna simples para 40% e §6 a empilhada para 36%. São medidas de
 * ESPECIFICAÇÃO e moram no `chart-theme`; aqui ficam os apelidos locais, em
 * fração porque o cálculo da faixa é feito em runtime.
 */
const SINGLE_BAR_WIDTH = CHART_GEOMETRY.barWidthSingle;
const STACKED_BAR_WIDTH = CHART_GEOMETRY.barWidthStacked;

/**
 * §5 — o "traço de 2px transparente" da coluna múltipla é o respiro entre as
 * colunas vizinhas de um mesmo grupo. Em SVG um contorno transparente não abre
 * buraco no preenchimento, então o equivalente honesto no recharts é o espaço
 * entre barras (`barGap`), com a mesma medida.
 */
const GROUP_GAP = CHART_GEOMETRY.barGroupGap;

/**
 * §7 — a coluna negativa pinta por FAIXA: de −100 a −46 âmbar, de −45 a 0
 * ciano. O catálogo não conhece a escala do eixo em tempo de projeto, então a
 * fronteira é RELATIVA à queda mais funda do dado — 45% dela, que é onde a
 * referência a coloca quando o mínimo é −100.
 */
const DEEP_RANGE = 0.45;

/** Índice da 2ª cor da paleta (âmbar) — a faixa funda de §7. */
const DEEP_RANGE_COLOR = 1;

/** Índice da 3ª cor da paleta (ciano) — a faixa rasa de §7. */
const SHALLOW_RANGE_COLOR = 2;

/**
 * Token da 1ª cor do ciclo (o verde do produto). Nas colunas a referência usa
 * a versão a 80% dele — ver `paintAt`.
 */
const FIRST_CYCLE_TOKEN = chartSeriesToken(CHART_SERIES_COLORS[0]);

/** As três formas da mesma cor: SVG, realce do hover e marca da legenda. */
interface BarPaint {
  /** Valor resolvido — vai para dentro do SVG. */
  fill: string;
  /** O mesmo valor ESCURECIDO (hover/ativo). */
  hover: string;
  /** Forma usada no DOM (legenda). */
  swatch: string;
}

/**
 * Cor da série/categoria `index`.
 *
 * Onde cairia a 1ª cor do ciclo (o verde do produto), a referência usa o VERDE
 * ESCURO A 80% — `rgba(0,120,103,.8)`, a cor das colunas em §4, §5 e §6 e a
 * mais recorrente do catálogo. As demais seguem a paleta na ordem: âmbar,
 * ciano, vermelho…
 */
function paintAt(
  palette: ChartPalette,
  index: number,
  override?: ChartSeriesColor,
): BarPaint {
  if (palette.tokenAt(index, override) === FIRST_CYCLE_TOKEN) {
    return {
      fill: palette.primary80,
      hover: darkenColor(palette.primary80),
      swatch: palette.primary80,
    };
  }
  return {
    fill: palette.colorAt(index, override),
    hover: palette.hoverAt(index, override),
    swatch: palette.varAt(index, override),
  };
}

/** Cor de UMA coluna pela faixa do seu valor (§7). */
function rangeFill(palette: ChartPalette, value: number, floor: number): string {
  if (value >= 0) return paintAt(palette, 0).fill;
  return value < floor * DEEP_RANGE
    ? palette.colorAt(DEEP_RANGE_COLOR)
    : palette.colorAt(SHALLOW_RANGE_COLOR);
}

/** Menor valor plotado — a âncora da faixa de cor da coluna negativa (§7). */
function lowestValue(series: ChartSeries[]): number {
  const values = series.flatMap((item) => item.data).filter(Number.isFinite);
  return values.length > 0 ? Math.min(...values) : 0;
}

/**
 * Largura da coluna (fração da faixa): o responsivo de §11 vence o layout,
 * porque abaixo de 900px a coluna fina simplesmente some.
 */
function barWidthOf({
  geometry,
  isStacked,
  isGrouped,
  isMedium,
  isNarrow,
}: {
  geometry: ChartPalette['geometry'];
  isStacked: boolean;
  isGrouped: boolean;
  isMedium: boolean;
  isNarrow: boolean;
}): number {
  if (isNarrow) return geometry.barWidthSm;
  if (isMedium) return geometry.barWidthMd;
  if (isStacked) return STACKED_BAR_WIDTH;
  return isGrouped ? geometry.barWidth : SINGLE_BAR_WIDTH;
}

/**
 * Hover ESCURECE também quando cada coluna tem a sua cor (`<Cell>`): aí o
 * realce só é conhecido no ponteiro, então escurecemos o preenchimento que a
 * coluna já tinha em vez de fixar uma cor para a série inteira.
 */
function renderDarkenedBar(props: unknown): ReactElement {
  const shape = props as ComponentProps<typeof Rectangle>;
  return <Rectangle {...shape} fill={shape.fill ? darkenColor(shape.fill) : undefined} />;
}

/** Gráfico de colunas: simples, múltiplas, empilhadas ou por faixa de valor. */
export function BarChart({
  series,
  labels,
  // §4–§7: 320px é a altura dos quatro layouts de coluna (e de 13 dos 18 tipos).
  height = CHART_HEIGHT.default,
  isStacked = false,
  hasColorByCategory = false,
  hasColorByValue,
  showGrid = true,
  showLegend = true,
  valueFormatter = formatChartValue,
  axisFormatter,
  scope,
  isLoading,
  emptyMessage,
  label = 'Gráfico de barras',
  summary,
}: BarChartProps) {
  const palette = useChartPalette();
  // §11 — a geometria da coluna responde à largura da tela, não ao dado.
  const isMedium = useMediaQuery(MEDIUM_QUERY);
  const isNarrow = useMediaQuery(NARROW_QUERY);

  const isEmpty = isSeriesEmpty(series);
  const rows = toChartRows(series, labels);
  const tickFormatter = axisFormatter ?? valueFormatter;

  const byCategory = hasColorByCategory && series.length === 1;
  const floor = lowestValue(series);
  const byValue =
    !byCategory && !isStacked && (hasColorByValue ?? (floor < 0 && series.length === 1));
  const isGrouped = series.length > 1 && !isStacked;
  const hasCells = byCategory || byValue;
  /**
   * §4 e §7 pedem tooltip SEM título — na coluna simples o cursor já destaca a
   * categoria, que está logo abaixo no eixo. §5 e §6 mantêm a faixa com a
   * categoria porque ali o tooltip compara várias séries. O modo multicolorido
   * por categoria não existe na referência e mantém o título: nele a categoria
   * É a informação.
   */
  const hasTooltipTitle = isGrouped || isStacked || byCategory;

  const geometry = palette.geometry;
  const barWidth = barWidthOf({ geometry, isStacked, isGrouped, isMedium, isNarrow });
  /**
   * O recharts não tem "largura da coluna": ele recorta a faixa pelos DOIS
   * lados (`barCategoryGap` vale para cada um) e o que sobra é a coluna. Daí a
   * conversão — feita em runtime porque a largura depende do layout e da tela.
   */
  const categoryGap = `${((1 - barWidth) / 2) * 100}%`;

  /** Raio do topo: 4px na base, 3px abaixo de 600px (§11). */
  const topRadius = isNarrow
    ? ([geometry.barRadiusSm, geometry.barRadiusSm, 0, 0] as [
        number,
        number,
        number,
        number,
      ])
    : chartBarRadius(palette);

  /**
   * §7 arredonda as duas pontas com 2px porque a coluna negativa cresce para
   * BAIXO — a "ponta" muda de lado conforme o sinal. Na pilha (§6) só o último
   * segmento arredonda: é ele que forma o topo, e arredondar os do meio criaria
   * um degrau dentro da coluna.
   */
  const radiusAt = (index: number) => {
    if (byValue) return geometry.barRadiusFlat;
    if (!isStacked) return topRadius;
    return index === series.length - 1 ? topRadius : undefined;
  };

  const legendItems = byCategory
    ? rows.map((row, index) => ({
        label: String(row[CATEGORY_KEY]),
        color: paintAt(palette, index).swatch,
      }))
    : series.map((item, index) => ({
        label: item.label,
        color: paintAt(palette, index, item.color).swatch,
      }));

  return (
    <ChartFrame
      label={label}
      summary={summary ?? describeSeries(series, valueFormatter)}
      scope={scope}
      height={height}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      footer={
        showLegend ? (
          // §6 — a empilhada alinha a legenda à direita; as demais centralizam.
          <ChartLegend items={legendItems} align={isStacked ? 'end' : 'center'} />
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={rows}
          margin={CHART_MARGIN}
          barCategoryGap={categoryGap}
          barGap={isGrouped ? GROUP_GAP : 0}
        >
          {showGrid ? <CartesianGrid {...chartGridProps(palette)} /> : null}
          <XAxis dataKey={CATEGORY_KEY} {...chartAxisProps(palette)} />
          <YAxis
            width={Y_AXIS_WIDTH}
            tickFormatter={tickFormatter}
            {...chartYAxisProps(palette)}
          />
          <Tooltip
            cursor={chartBarCursorProps(palette)}
            wrapperStyle={{ outline: 'none' }}
            content={(props) => (
              <ChartSeriesTooltip
                isActive={props.active}
                title={hasTooltipTitle ? String(props.label ?? '') : undefined}
                entries={props.payload ?? undefined}
                series={series}
                palette={palette}
                format={valueFormatter}
              />
            )}
          />
          {series.map((item, index) => {
            const paint = paintAt(palette, index, item.color);
            return (
              <Bar
                key={seriesKey(index)}
                dataKey={seriesKey(index)}
                name={item.label}
                stackId={isStacked ? 'stack' : undefined}
                fill={paint.fill}
                radius={radiusAt(index)}
                // Hover ESCURECE (`02-configuracao-base.md` §4).
                activeBar={hasCells ? renderDarkenedBar : { fill: paint.hover }}
                {...chartAnimationProps(palette, index)}
              >
                {hasCells
                  ? rows.map((row, rowIndex) => (
                      <Cell
                        key={`${String(row[CATEGORY_KEY])}-${rowIndex}`}
                        fill={
                          byValue
                            ? rangeFill(
                                palette,
                                Number(row[seriesKey(index)] ?? 0),
                                floor,
                              )
                            : paintAt(palette, rowIndex).fill
                        }
                      />
                    ))
                  : null}
              </Bar>
            );
          })}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
