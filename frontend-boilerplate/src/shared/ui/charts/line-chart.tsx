/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "tendência ao longo
 * do tempo": uma ou mais linhas, com área opcional sob elas.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT: `03-tipos-de-grafico.md` §1 (Linha) da referência de design
 * ---------------------------------------------------------------------------
 * O tipo Linha herda a configuração base (grade só horizontal tracejada `3`,
 * eixos sem linha nem marcação, texto de eixo 12px, hover que ESCURECE,
 * animação de 360ms com 120ms de atraso por série) e SOBREPÕE quatro coisas:
 *
 *   cores        `rgba(0,120,103,.8)` (o verde escuro a 80%, a cor mais
 *                recorrente do catálogo) e âmbar — as demais séries seguem o
 *                ciclo da paleta;
 *   altura       320px (o padrão do catálogo);
 *   legenda      LIGADA (na base ela vem desligada);
 *   marcadores   VISÍVEIS (na base são invisíveis): 6px de DIÂMETRO — o `r` do
 *                SVG é METADE disso — com halo na cor da superfície. A conta
 *                mora em `chart-marker`, que é a única leitura do token.
 *
 * Nenhuma cor, medida, tipografia ou duração é digitada aqui: tudo sai de
 * `useChartPalette()` e dos props compartilhados de `chart-axes`.
 */
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_MARGIN,
  Y_AXIS_WIDTH,
  chartAnimationProps,
  chartAxisProps,
  chartCursorProps,
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
import { ChartFrame, type ChartFrameState } from './chart-frame';
import { ChartLegend } from './chart-legend';
import { chartMarkerProps } from './chart-marker';
import { ChartSeriesTooltip } from './chart-series-tooltip';
import { CHART_GEOMETRY, CHART_HEIGHT } from './chart-theme';
import { hasVariables, type ChartScope } from './chart-template';
import { chartPlainText } from './chart-text-html';
import type { ChartSeries, ChartStateProps, ValueFormatter } from './types';
import {
  darkenColor,
  isChartSeriesColor,
  useChartPalette,
  type ChartPalette,
  type ChartSeriesColor,
} from './use-chart-palette';

export interface LineChartProps extends ChartStateProps {
  /** Séries desenhadas (uma linha cada). */
  series: ChartSeries[];
  /** Rótulos do eixo X, um por ponto. */
  labels?: string[];
  /** Altura da plotagem em px. */
  height?: number;
  /** Curva suave (monotone) em vez de segmentos retos. */
  isSmooth?: boolean;
  /** Preenche a área sob cada linha, bem discreta. */
  showArea?: boolean;
  /** Marcadores em cada ponto (além do ponto ativo do hover). */
  showDots?: boolean;
  /** Linhas de grade horizontais. */
  showGrid?: boolean;
  /** Legenda série → cor abaixo da plotagem. */
  showLegend?: boolean;
  /** Formata o valor no tooltip. */
  valueFormatter?: ValueFormatter;
  /** Formata os ticks dos eixos. Sem isto, usa `valueFormatter`. */
  axisFormatter?: ValueFormatter;
  /**
   * Escopo de `{{variaveis}}` dos textos do gráfico (de `buildChartScope`).
   * O `ChartFrame` o usa no rótulo acessível e na mensagem de vazio; aqui ele
   * também alcança rótulo de série, categoria do eixo e título do tooltip.
   */
  scope?: ChartScope;
  /**
   * Estado do gráfico. `error` troca o desenho pelo aviso do `ChartFrame` —
   * sem isto, uma falha de consulta apareceria como "sem dados".
   */
  state?: ChartFrameState;
  /** Detalhe do erro exibido quando `state="error"`. */
  errorMessage?: string;
}

/**
 * Opacidade da área sob a linha. A §1 NÃO prevê preenchimento no tipo Linha —
 * a prop `showArea` é do produto (o bloco do catálogo a expõe como `area`), e
 * a área existe só como contexto: opacidade baixa para a linha continuar sendo
 * o que se lê. Fica aqui, e não no tema, porque nenhum tipo da referência a
 * define (pedido registrado em `docs/charts/PEDIDOS-BASE.md`).
 */
const AREA_FILL_OPACITY = CHART_GEOMETRY.areaContextOpacity;

/** Gráfico de linha com eixos, grade, tooltip e legenda tematizados. */
export function LineChart({
  series,
  labels,
  height = CHART_HEIGHT.default,
  isSmooth = true,
  showArea = false,
  showDots = true,
  showGrid = true,
  showLegend = true,
  valueFormatter = formatChartValue,
  axisFormatter,
  scope,
  state,
  isLoading,
  emptyMessage,
  errorMessage,
  label = 'Gráfico de linha',
  summary,
}: LineChartProps) {
  const palette = useChartPalette();

  // Rótulo de série é texto do bloco: passa pelo contrato comum antes de ser
  // desenhado (legenda, tooltip e equivalente textual leem daqui).
  const named = series.map((item) => ({ ...item, label: dataText(item.label, scope) }));
  const isEmpty = isSeriesEmpty(series);
  const rows = toChartRows(series, labels);
  const tickFormatter = axisFormatter ?? valueFormatter;
  const curve = isSmooth ? palette.geometry.curve : 'linear';

  return (
    <ChartFrame
      label={label}
      summary={summary ?? describeSeries(named, valueFormatter)}
      height={height}
      scope={scope}
      state={state}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
      footer={
        showLegend ? (
          <ChartLegend
            items={named.map((item, index) => ({
              label: item.label,
              color: seriesVarAt(palette, index, item.color),
            }))}
          />
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={rows} margin={CHART_MARGIN}>
          {showGrid ? <CartesianGrid {...chartGridProps(palette)} /> : null}
          {/* Eixo X de categorias (§1): o rótulo é o dado, não uma escala. */}
          <XAxis
            dataKey={CATEGORY_KEY}
            tickFormatter={(value: unknown) => dataText(String(value ?? ''), scope)}
            {...chartAxisProps(palette)}
          />
          <YAxis
            width={Y_AXIS_WIDTH}
            tickFormatter={tickFormatter}
            {...chartYAxisProps(palette)}
          />
          <Tooltip
            cursor={chartCursorProps(palette)}
            wrapperStyle={{ outline: 'none' }}
            content={(props) => (
              <ChartSeriesTooltip
                isActive={props.active}
                title={dataText(String(props.label ?? ''), scope)}
                entries={props.payload ?? undefined}
                series={named}
                palette={palette}
                format={valueFormatter}
              />
            )}
          />
          {showArea
            ? series.map((item, index) => (
                <Area
                  key={`area-${seriesKey(index)}`}
                  dataKey={seriesKey(index)}
                  name={named[index].label}
                  type={curve}
                  stroke="none"
                  fill={seriesColorAt(palette, index, item.color)}
                  fillOpacity={AREA_FILL_OPACITY}
                  legendType="none"
                  tooltipType="none"
                  {...chartAnimationProps(palette, index)}
                />
              ))
            : null}
          {series.map((item, index) => (
            <Line
              key={seriesKey(index)}
              dataKey={seriesKey(index)}
              name={named[index].label}
              type={curve}
              stroke={seriesColorAt(palette, index, item.color)}
              strokeWidth={palette.geometry.lineWidth}
              strokeLinecap={palette.geometry.lineCap}
              // Marcador da §1 — raio, halo e cor saem todos de `chart-marker`:
              // é o que garante que este ponto e o do spark tenham o MESMO
              // diâmetro quando os dois blocos caem na mesma tela.
              dot={
                showDots
                  ? chartMarkerProps(palette, seriesColorAt(palette, index, item.color))
                  : false
              }
              // Hover ESCURECE (a maioria das libs clareia) — §4 da base.
              activeDot={chartMarkerProps(
                palette,
                seriesHoverAt(palette, index, item.color),
              )}
              {...chartAnimationProps(palette, index)}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/**
 * Cor RESOLVIDA da série `index` (para dentro do SVG).
 *
 * A §1 troca a PRIMEIRA cor do ciclo pelo verde escuro a 80%
 * (`rgba(0,120,103,.8)`) e mantém o resto — a 2ª série continua sendo o âmbar
 * do ciclo. Cor explícita na série vence sempre (é o modo `single` do bloco).
 */
function seriesColorAt(
  palette: ChartPalette,
  index: number,
  override?: ChartSeriesColor,
): string {
  if (isChartSeriesColor(override)) return palette.colorAt(index, override);
  return index === 0 ? palette.primary80 : palette.colorAt(index);
}

/**
 * Cor da série `index` para o DOM (legenda). `var(--token)` sempre que a cor
 * vem do ciclo; o verde a 80% da §1 é token + opacidade, e por isso só existe
 * na forma resolvida que o `useChartPalette` calcula.
 */
function seriesVarAt(
  palette: ChartPalette,
  index: number,
  override?: ChartSeriesColor,
): string {
  if (isChartSeriesColor(override)) return palette.varAt(index, override);
  return index === 0 ? palette.primary80 : palette.varAt(index);
}

/**
 * Cor do ponto ATIVO (hover): a da série, escurecida. Para cores do ciclo é
 * exatamente `palette.hoverAt(i)`; o verde a 80% da §1 não está no ciclo,
 * então escurece pelo mesmo fator, com o mesmo utilitário do tema.
 */
function seriesHoverAt(
  palette: ChartPalette,
  index: number,
  override?: ChartSeriesColor,
): string {
  if (isChartSeriesColor(override)) return palette.hoverAt(index, override);
  return index === 0 ? darkenColor(palette.primary80) : palette.hoverAt(index);
}

/**
 * Texto DESENHADO a partir do dado (rótulo de série, categoria do eixo, título
 * do tooltip). Passa pelo contrato comum de `{{interpolação}}`, mas só quando o
 * texto realmente tem variáveis: um rótulo vindo da consulta (`pix_enviado`,
 * `2026-01`) não pode perder caractere para a remoção de marcação do markdown.
 * Texto CONFIGURADO do bloco (rótulo acessível, mensagem de vazio) é resolvido
 * pelo `ChartFrame`, que recebe o mesmo `scope`.
 */
function dataText(value: string, scope?: ChartScope): string {
  return scope && hasVariables(value) ? chartPlainText(value, scope) : value;
}
