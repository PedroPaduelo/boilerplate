/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "correlação entre
 * duas medidas": dispersão X/Y, com tamanho de bolha e agrupamento por
 * categoria opcionais.
 *
 * Substitui `scatter-chart-tremor.tsx` (525 linhas): a legenda, o tooltip e a
 * lógica de cor viviam ali dentro, com paleta `blue/emerald`, fundo branco fixo
 * e um cinza cravado no cursor. Aqui sobrou só a plotagem — legenda, tooltip,
 * eixos, grade e estados são os primitivos compartilhados desta pasta, e toda
 * cor sai de token.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT — `03-tipos-de-grafico.md` §15 (Dispersão)
 * ---------------------------------------------------------------------------
 *   cores       paleta base NA ORDEM, uma por categoria (`palette.colorAt(i)`)
 *   altura      350px (`CHART_HEIGHT.scatter`)
 *   marcadores  6px de DIÂMETRO (`geometry.markerVisibleSize`), com o contorno
 *               da superfície — os dois vêm de `chart-marker`, que converte o
 *               diâmetro na ÁREA que o recharts pede
 *   eixo X      8 divisões, valores com 1 casa decimal
 *   legenda     ligada
 *   grade       só horizontal, tracejada 3 (herdada da base)
 *   hover       ESCURECE (`palette.hoverAt(i)`), nunca clareia
 *   animação    360ms, 120ms de atraso por série
 *
 * ⚠️ ZOOM: a referência liga zoom `xy` na dispersão — é o ÚNICO tipo do
 * catálogo com zoom. O recharts 2.x não tem equivalente nativo (só `<Brush>`,
 * de um eixo só) e trocar de biblioteca está fora de escopo. A lacuna está
 * registrada em `docs/charts/NOTAS.md` e `docs/charts/PEDIDOS-BASE.md`
 * (`[SUB-07]`); todo o resto do §15 está implementado.
 */
import { useMemo } from 'react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
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
import { formatChartValue } from './chart-data';
import { ChartFrame } from './chart-frame';
import type { ChartFrameState } from './chart-frame';
import { ChartLegend } from './chart-legend';
import { chartMarkerArea, chartMarkerStrokeWidth } from './chart-marker';
import { CHART_GEOMETRY, CHART_HEIGHT } from './chart-theme';
import { buildChartScope } from './chart-template';
import type { ChartScope } from './chart-template';
import { chartPlainText } from './chart-text-html';
import { ChartTooltip } from './chart-tooltip';
import type { ChartStateProps, ValueFormatter } from './types';
import { useChartPalette } from './use-chart-palette';

/** Um ponto do gráfico de dispersão. */
export interface ScatterPoint {
  /** Valor no eixo X. */
  x: number;
  /** Valor no eixo Y. */
  y: number;
  /** Peso da bolha (só é usado quando `sizeRange` está definido). */
  size?: number;
  /** Grupo do ponto — cada grupo vira uma cor e uma entrada na legenda. */
  category?: string;
}

export interface ScatterChartProps extends ChartStateProps {
  /** Pontos desenhados. */
  data: ScatterPoint[];
  /** Altura da plotagem em px. */
  height?: number;
  /** Nome do eixo X, exibido no tooltip. Aceita Markdown e `{{variavel}}`. */
  xLabel?: string;
  /** Nome do eixo Y, exibido no tooltip. Aceita Markdown e `{{variavel}}`. */
  yLabel?: string;
  /**
   * Faixa de ÁREA da bolha (px²) quando os pontos trazem `size` — a mesma
   * unidade de `chartMarkerArea`, e não um diâmetro.
   *
   * ⚠️ O default `[60, 500]` (≈ 8,7px a 25,2px de diâmetro) é a única medida
   * de desenho deste arquivo que NÃO sai do tema: a escala não publica degrau
   * de bolha. Fica como está para não mudar o efeito de uma prop pública —
   * pedido de token registrado no relatório do lote.
   */
  sizeRange?: [number, number];
  /** Linhas de grade. */
  showGrid?: boolean;
  /** Legenda categoria → cor abaixo da plotagem. */
  showLegend?: boolean;
  /** Formata os valores no tooltip. */
  valueFormatter?: ValueFormatter;
  /** Formata os ticks dos eixos. Sem isto, usa `valueFormatter`. */
  axisFormatter?: ValueFormatter;
  /**
   * Formata só os ticks do eixo X. Sem isto, a referência manda 1 casa
   * decimal (§15) — por isso o X não cai no `valueFormatter`.
   */
  xAxisFormatter?: ValueFormatter;
  /** Formata só os ticks do eixo Y. Sem isto, usa `axisFormatter`. */
  yAxisFormatter?: ValueFormatter;
  /**
   * Escopo de `{{interpolação}}` dos textos. Sem isto, é derivado dos próprios
   * pontos (`buildChartScope`).
   */
  scope?: ChartScope;
  /**
   * Estado do gráfico. `error`/`forbidden` substituem o desenho pelo aviso do
   * `ChartFrame`; `success` deixa carregando/vazio serem derivados dos dados.
   */
  state?: ChartFrameState;
  /** Detalhe exibido no estado de erro (a causa). */
  errorMessage?: string;
}

/** Rótulo usado quando o ponto não declara categoria. */
const DEFAULT_CATEGORY = 'Série';

/**
 * Divisões do eixo X (§15). O recharts conta os LIMITES, então 8 divisões são
 * 9 marcas — a mesma conta que `chartYAxisProps` faz para o eixo Y.
 *
 * Era uma constante local enquanto a base não expunha a métrica (o pedido está
 * em `docs/charts/PEDIDOS-BASE.md`, `[SUB-07]`); a escala publicou
 * `scatterXTickCount` e isto virou o apelido dela. Fica como apelido só porque
 * o nome curto explica a conta do `tickCount` logo abaixo.
 */
const X_TICK_COUNT = CHART_GEOMETRY.scatterXTickCount;

/** Casas decimais dos valores do eixo X (§15: "valores com 1 casa decimal"). */
const X_AXIS_DECIMALS = CHART_GEOMETRY.scatterAxisDecimals;

/** Formata um valor do eixo X com 1 casa decimal fixa, em PT-BR (§15). */
const formatScatterAxisValue: ValueFormatter = (value) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: X_AXIS_DECIMALS,
        maximumFractionDigits: X_AXIS_DECIMALS,
      }).format(value)
    : '—';

/** Agrupa os pontos por categoria, preservando a ordem de aparição. */
function groupByCategory(data: ScatterPoint[]): [string, ScatterPoint[]][] {
  const groups = new Map<string, ScatterPoint[]>();
  for (const point of data) {
    const key = point.category ?? DEFAULT_CATEGORY;
    const bucket = groups.get(key);
    if (bucket) bucket.push(point);
    else groups.set(key, [point]);
  }
  return [...groups.entries()];
}

/** Gráfico de dispersão com eixos numéricos e bolhas opcionais. */
export function ScatterChart({
  data,
  height = CHART_HEIGHT.scatter,
  xLabel = 'X',
  yLabel = 'Y',
  sizeRange = [60, 500],
  showGrid = true,
  showLegend = true,
  valueFormatter = formatChartValue,
  axisFormatter,
  xAxisFormatter,
  yAxisFormatter,
  scope,
  state,
  errorMessage,
  isLoading,
  emptyMessage,
  label = 'Gráfico de dispersão',
  summary,
}: ScatterChartProps) {
  const palette = useChartPalette();
  const groups = groupByCategory(data);
  const hasSize = data.some((point) => typeof point.size === 'number');

  // Contrato comum: todo texto do bloco aceita Markdown + `{{variavel}}`, e o
  // vocabulário sai dos DADOS. Sem escopo do chamador, derivamos dos pontos.
  const resolvedScope = useMemo<ChartScope>(
    () => scope ?? buildChartScope(data),
    [scope, data],
  );
  const xName = chartPlainText(xLabel, resolvedScope) || xLabel;
  const yName = chartPlainText(yLabel, resolvedScope) || yLabel;

  const xTickFormatter = xAxisFormatter ?? axisFormatter ?? formatScatterAxisValue;
  const yTickFormatter = yAxisFormatter ?? axisFormatter ?? valueFormatter;

  /**
   * O recharts mede o símbolo pela ÁREA, e o token é DIÂMETRO — a conversão
   * (`π·(d/2)²`) mora em `chart-marker`, junto com a dos outros tipos.
   *
   * Aqui é onde a ambiguidade do token doeu mais: a conta antiga era `π·d²`,
   * isto é, tratava 6 como raio. Quatro vezes a área pretendida, ponto de 12px
   * — o dobro do diâmetro do ponto da linha, na mesma tela do `/catalog`.
   */
  const markerArea = chartMarkerArea(palette);

  // `success` explícito não pode mascarar "carregando"/"sem dados" — esses dois
  // continuam derivados dos dados pelo próprio `ChartFrame`.
  const frameState = state && state !== 'success' ? state : undefined;

  return (
    <ChartFrame
      label={label}
      summary={
        summary ??
        `${data.length} pontos em ${groups.length} categoria(s), eixos ${xName} e ${yName}.`
      }
      height={height}
      scope={resolvedScope}
      state={frameState}
      errorMessage={errorMessage}
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyMessage={emptyMessage}
      footer={
        showLegend ? (
          <ChartLegend
            items={groups.map(([name], index) => ({
              label: name,
              color: palette.varAt(index),
            }))}
          />
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsScatterChart margin={CHART_MARGIN}>
          {showGrid ? <CartesianGrid {...chartGridProps(palette)} /> : null}
          <XAxis
            type="number"
            dataKey="x"
            name={xName}
            tickCount={X_TICK_COUNT + 1}
            tickFormatter={xTickFormatter}
            {...chartAxisProps(palette)}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yName}
            width={Y_AXIS_WIDTH}
            tickFormatter={yTickFormatter}
            {...chartYAxisProps(palette)}
          />
          {hasSize ? (
            <ZAxis type="number" dataKey="size" range={sizeRange} />
          ) : (
            <ZAxis type="number" range={[markerArea, markerArea]} />
          )}
          <Tooltip
            cursor={chartCursorProps(palette)}
            wrapperStyle={{ outline: 'none' }}
            content={(props) => {
              const entry = props.payload?.[0];
              if (!props.active || !entry) return null;
              const point = entry.payload as ScatterPoint | undefined;
              if (!point) return null;
              const category = point.category ?? DEFAULT_CATEGORY;
              const index = groups.findIndex(([name]) => name === category);
              return (
                <ChartTooltip
                  title={category}
                  rows={[
                    {
                      label: xName,
                      value: valueFormatter(point.x),
                      color: palette.varAt(index < 0 ? 0 : index),
                    },
                    { label: yName, value: valueFormatter(point.y) },
                  ]}
                />
              );
            }}
          />
          {groups.map(([name, points], index) => (
            <Scatter
              key={name}
              name={name}
              data={points}
              fill={palette.colorAt(index)}
              stroke={palette.chrome('markerStroke')}
              // Halo proporcional ao raio: com os 3px crus do token, um ponto
              // de 6px ficaria com metade do miolo comida — anel, não ponto.
              strokeWidth={chartMarkerStrokeWidth(palette)}
              // O hover da referência ESCURECE a série (a maioria das libs clareia).
              activeShape={{ fill: palette.hoverAt(index) }}
              {...chartAnimationProps(palette, index)}
            />
          ))}
        </RechartsScatterChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
