/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "volume ao longo do
 * tempo": uma ou mais séries sobrepostas, empilhadas ou normalizadas em 100%.
 *
 * Substitui `area-chart.tsx` (SVG à mão, 409 linhas) e `area-chart-tremor.tsx`
 * (cópia do Tremor, 986 linhas, cores `blue-500`/`gray-200` fora do tema). Aqui
 * a plotagem é do recharts e TUDO que é cor/tipografia vem de token, via
 * `useChartPalette`; eixos, grade, tooltip, legenda e estados vêm dos
 * primitivos compartilhados desta pasta.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT — `03-tipos-de-grafico.md` §2 (Área) sobre a configuração base
 * ---------------------------------------------------------------------------
 *  1. cores: 1ª e 2ª do ciclo (#00A76F, #FFAB00) — `palette.colorAt(0|1)`;
 *  2. altura 320px (`CHART_HEIGHT.default`) — `01-fundamentos.md` §7;
 *  3. legenda LIGADA;
 *  4. preenchimento em GRADIENTE VERTICAL, 0.4 no topo → 0 na base, paradas
 *     0 e 100 (`02-configuracao-base.md` §5) — `<linearGradient>` com id único
 *     por série, porque a cor de cada série entra nos `stop`s;
 *  5. linha 2,5px, curva suave, ponta arredondada e SEM pontos (§6) — o único
 *     marcador é o do HOVER, e ele usa o mesmo `chart-marker` da linha e da
 *     dispersão: 6px de DIÂMETRO (o `r` do SVG é metade), halo proporcional;
 *  6. grade só horizontal tracejada 3; eixos sem linha e sem marcações; 5
 *     divisões no Y (§7) — tudo de `chart-axes`;
 *  7. hover ESCURECE a série (§4) — `palette.hoverAt(i)` no ponto ativo;
 *  8. tooltip branco 90% com desfoque (`ChartSeriesTooltip`);
 *  9. animação de entrada 360ms com 120ms de atraso por série (§3).
 *
 * A tradução Apex → recharts está em `06-portabilidade.md` §3.1.
 */
import { useId } from 'react';
import {
  Area,
  CartesianGrid,
  AreaChart as RechartsAreaChart,
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
  toPercentRows,
} from './chart-data';
import { ChartFrame } from './chart-frame';
import { useChartMotion } from './chart-motion';
import type { ChartFrameState } from './chart-frame';
import { ChartLegend } from './chart-legend';
import { chartMarkerProps } from './chart-marker';
import { ChartSeriesTooltip } from './chart-series-tooltip';
import type { ChartScope } from './chart-template';
import { chartPlainText } from './chart-text-html';
import { CHART_GEOMETRY, CHART_HEIGHT } from './chart-theme';
import type { ChartSeries, ChartStateProps, ValueFormatter } from './types';
import { useChartPalette } from './use-chart-palette';

/** Composição das áreas: sobrepostas, empilhadas ou normalizadas em 100%. */
export type AreaChartMode = 'default' | 'stacked' | 'percent';

/** Preenchimento sob a linha de topo. */
export type AreaChartFill = 'gradient' | 'solid' | 'none';

export interface AreaChartProps extends ChartStateProps {
  /** Séries desenhadas (uma área + linha de topo cada). */
  series: ChartSeries[];
  /** Rótulos do eixo X, um por ponto. */
  labels?: string[];
  /** Altura da plotagem em px. */
  height?: number;
  /** Composição das áreas. */
  mode?: AreaChartMode;
  /** Estilo do preenchimento. */
  fill?: AreaChartFill;
  /** Curva suave (monotone) em vez de segmentos retos. */
  isSmooth?: boolean;
  /** Linhas de grade horizontais. */
  showGrid?: boolean;
  /** Legenda série → cor abaixo da plotagem. */
  showLegend?: boolean;
  /** Formata o valor no tooltip. */
  valueFormatter?: ValueFormatter;
  /** Formata os ticks dos eixos. Sem isto, usa `valueFormatter`. */
  axisFormatter?: ValueFormatter;
  /**
   * Estado do gráfico, para os casos que `isLoading`/vazio não cobrem (erro,
   * sem permissão). `success` é ignorado de propósito: quem sabe se há dados
   * para desenhar é este componente, não quem o chama.
   */
  state?: ChartFrameState;
  /** Detalhe do erro, exibido no aviso quando `state="error"`. */
  errorMessage?: string;
  /**
   * Escopo de `{{interpolação}}` dos textos (de `buildChartScope`). Vale para
   * rótulo acessível, resumo e mensagem de vazio — o contrato comum do
   * catálogo manda TODO texto de bloco passar por ele.
   */
  scope?: ChartScope;
}

/**
 * PREENCHIMENTO — `02-configuracao-base.md` §5: gradiente VERTICAL, opacidade
 * 0.4 no topo → 0 na base, paradas em 0 e 100. Os quatro números vivem no
 * `chart-theme` (`CHART_GEOMETRY.areaGradient`) — aqui é só o apelido local.
 */
const AREA_GRADIENT = CHART_GEOMETRY.areaGradient;

/**
 * Opacidade do modo `solid` — a MESMA do topo do gradiente. Trocar de modo
 * muda a DISTRIBUIÇÃO do preenchimento, não a leitura da cor.
 */
const SOLID_FILL_OPACITY = AREA_GRADIENT.opacityFrom;

/** Gráfico de área com eixos, grade, tooltip e legenda tematizados. */
export function AreaChart({
  series,
  labels,
  height = CHART_HEIGHT.default,
  mode = 'default',
  fill = 'gradient',
  isSmooth = true,
  showGrid = true,
  showLegend = true,
  valueFormatter = formatChartValue,
  axisFormatter,
  isLoading,
  state,
  emptyMessage,
  errorMessage,
  label = 'Gráfico de área',
  summary,
  scope,
}: AreaChartProps) {
  const palette = useChartPalette();
  // Entrada animada só quando o usuário não pediu redução de movimento.
  const isAnimationActive = useChartMotion();
  // `useId` devolve `:r0:`; os dois-pontos atrapalham `url(#id)` em SVG.
  const uid = useId().replace(/:/g, '');
  const isEmpty = isSeriesEmpty(series);
  const tickFormatter = axisFormatter ?? valueFormatter;

  const baseRows = toChartRows(series, labels);
  const rows = mode === 'percent' ? toPercentRows(baseRows, series.length) : baseRows;
  const stackId = mode === 'default' ? undefined : 'stack';
  // §6: curva SUAVE por padrão; `isSmooth={false}` volta aos segmentos retos.
  const curve = isSmooth ? palette.geometry.curve : 'linear';
  const gradientId = (index: number) => `${uid}-area-${index}`;
  // `success` não sobrepõe o vazio/carregando que este componente calcula.
  const frameState = state && state !== 'success' ? state : undefined;

  return (
    <ChartFrame
      label={label}
      scope={scope}
      summary={
        summary ? chartPlainText(summary, scope) : describeSeries(series, valueFormatter)
      }
      height={height}
      state={frameState}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
      footer={
        showLegend ? (
          <ChartLegend
            items={series.map((item, index) => ({
              label: chartPlainText(item.label, scope) || item.label,
              color: palette.varAt(index, item.color),
            }))}
          />
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={rows} margin={CHART_MARGIN}>
          {fill === 'gradient' ? (
            <defs>
              {series.map((item, index) => (
                <linearGradient
                  key={seriesKey(index)}
                  id={gradientId(index)}
                  // Vertical: (x1,y1) topo → (x2,y2) base. §5
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset={AREA_GRADIENT.from}
                    stopColor={palette.colorAt(index, item.color)}
                    stopOpacity={AREA_GRADIENT.opacityFrom}
                  />
                  <stop
                    offset={AREA_GRADIENT.to}
                    stopColor={palette.colorAt(index, item.color)}
                    stopOpacity={AREA_GRADIENT.opacityTo}
                  />
                </linearGradient>
              ))}
            </defs>
          ) : null}
          {showGrid ? <CartesianGrid {...chartGridProps(palette)} /> : null}
          <XAxis dataKey={CATEGORY_KEY} {...chartAxisProps(palette)} />
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
                title={String(props.label ?? '')}
                entries={props.payload ?? undefined}
                series={series}
                palette={palette}
                format={valueFormatter}
              />
            )}
          />
          {series.map((item, index) => (
            <Area
              key={seriesKey(index)}
              dataKey={seriesKey(index)}
              name={item.label}
              type={curve}
              stackId={stackId}
              stroke={palette.colorAt(index, item.color)}
              strokeWidth={palette.geometry.lineWidth}
              strokeLinecap={palette.geometry.lineCap}
              fill={
                fill === 'gradient'
                  ? `url(#${gradientId(index)})`
                  : palette.colorAt(index, item.color)
              }
              // Gradiente: opacidade sólida 1 (§5) — quem esmaece são os `stop`s.
              fillOpacity={
                fill === 'gradient' ? 1 : fill === 'solid' ? SOLID_FILL_OPACITY : 0
              }
              dot={false}
              // §6 não desenha ponto em repouso; o do HOVER é o mesmo marcador
              // dos outros tipos (`chart-marker`), e não uma cópia local — foi
              // a cópia que fez este ponto sair com o dobro do diâmetro.
              activeDot={chartMarkerProps(palette, palette.hoverAt(index, item.color))}
              {...chartAnimationProps(palette, index)}
              isAnimationActive={isAnimationActive}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
