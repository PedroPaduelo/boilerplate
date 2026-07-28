/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "ranking com rótulo
 * longo": barras horizontais, onde o nome da categoria cabe sem cortar.
 *
 * Quando o que se quer é uma LISTA "top N" (com valor à direita e sem eixos),
 * use `BarList` — este aqui é o gráfico com eixo.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT — `03-tipos-de-grafico.md` §8 (Barra horizontal)
 * ---------------------------------------------------------------------------
 *   orientação   horizontal (`layout="vertical"` na linguagem do recharts)
 *   cor          VERDE80 — `palette.primary80`, a mais recorrente do catálogo
 *   barra        30% da faixa (`geometry.hBarWidth`) → 35% de folga por lado
 *   raio         2px (`geometry.barRadiusFlat`) SÓ NA PONTA (direita)
 *   traço        0
 *   altura       320px (`CHART_HEIGHT.default`)
 *   grade        só a do eixo de VALOR — que aqui é o X (ver NOTAS [SUB-04])
 *   eixos        sem linha, sem marcação, texto 12px/400, 5 divisões no valor
 *   hover        ESCURECE (`darkenColor`), nunca clareia
 *   entrada      360ms (`chartAnimationProps`)
 *
 * Todo número acima sai de `useChartPalette()`; nada é digitado aqui.
 */
import { useMemo } from 'react';
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
import {
  CHART_MARGIN,
  chartAnimationProps,
  chartAxisProps,
  chartBarCursorProps,
  chartGridProps,
  chartYAxisProps,
} from './chart-axes';
import {
  CATEGORY_KEY,
  describePoints,
  formatChartValue,
  isPointsEmpty,
  toPointRows,
} from './chart-data';
import { ChartFrame, type ChartFrameState } from './chart-frame';
import { buildChartScope, type ChartScope } from './chart-template';
import { chartPlainText } from './chart-text-html';
import { ChartTooltip } from './chart-tooltip';
import type { ChartPoint, ChartStateProps, ValueFormatter } from './types';
import {
  CHART_HEIGHT,
  darkenColor,
  useChartPalette,
  type ChartPalette,
  type ChartSeriesColor,
} from './use-chart-palette';

export interface HBarChartProps extends ChartStateProps {
  /** Categorias desenhadas, na ordem recebida (ordene antes se precisar). */
  data: ChartPoint[];
  /** Altura da plotagem em px. */
  height?: number;
  /** Largura reservada aos rótulos de categoria, em px. */
  categoryWidth?: number;
  /** Uma cor por categoria em vez de uma cor só para todas. */
  hasColorByCategory?: boolean;
  /** Linhas de grade do eixo de valor. */
  showGrid?: boolean;
  /** Formata o valor no tooltip e nos ticks. */
  valueFormatter?: ValueFormatter;
  /**
   * Variáveis EXTRA de `{{interpolação}}` para os textos do gráfico (rótulo
   * acessível, mensagem de vazio, rótulos de categoria). O vocabulário comum
   * (`{{total}}`, `{{maximo}}`, `{{rotuloMaximo}}`…) já vem dos próprios dados.
   */
  scope?: ChartScope;
  /**
   * Estado do gráfico quando ele NÃO é derivável dos dados — `error` e
   * `forbidden` só o chamador conhece. `success` é ignorado de propósito: com
   * a consulta vazia, o estado "sem dados" continua valendo.
   */
  state?: ChartFrameState;
  /** Detalhe do erro exibido no estado `error`/`forbidden`. */
  errorMessage?: string;
}

/** Rótulo da linha de valor no tooltip (o gráfico tem uma medida só). */
const VALUE_ROW_LABEL = 'Valor';

/**
 * Traço 0 (§8). Não é medida de estilo — é a AUSÊNCIA de contorno, declarada
 * de propósito: a coluna múltipla (§5) usa traço transparente de 2px como
 * separador, e a barra horizontal explicitamente não usa nenhum.
 */
const BAR_STROKE_WIDTH = 0;

/**
 * Raio da barra horizontal: 2px aplicados SÓ NA PONTA, que aqui é a borda
 * DIREITA — `[superior-esq, superior-dir, inferior-dir, inferior-esq]`.
 * A base só oferece `chartBarRadius()`, que arredonda o topo de uma COLUNA.
 */
function hBarRadius(palette: ChartPalette): [number, number, number, number] {
  const r = palette.geometry.barRadiusFlat;
  return [0, r, r, 0];
}

/**
 * Folga da faixa de categoria. A referência declara a ALTURA DA BARRA (30% da
 * faixa, `geometry.hBarWidth`); o recharts pede a folga de CADA LADO —
 * internamente ele faz `tamanho = faixa − 2 × folga`. Daí a metade do
 * complemento: 30% de barra ⇒ 35% de folga em cima e 35% embaixo.
 *
 * É geometria derivada do DADO em runtime (depende de quantas categorias
 * cabem na faixa), por isso o cálculo mora aqui e não no tema.
 */
function categoryGap(palette: ChartPalette): string {
  return `${Math.round(((1 - palette.geometry.hBarWidth) / 2) * 100)}%`;
}

/** Campos do retângulo do recharts que a barra ativa (hover) reaproveita. */
interface ActiveBarShape {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}

/** Gráfico de barras horizontais com eixo de categorias à esquerda. */
export function HBarChart({
  data,
  height = CHART_HEIGHT.default,
  categoryWidth = 120,
  hasColorByCategory = false,
  showGrid = true,
  valueFormatter = formatChartValue,
  isLoading,
  emptyMessage,
  label = 'Gráfico de barras horizontais',
  summary,
  scope: extraScope,
  state,
  errorMessage,
}: HBarChartProps) {
  const palette = useChartPalette();

  // Contrato comum: as `{{variáveis}}` de todo texto do bloco saem dos DADOS.
  const scope = useMemo(() => buildChartScope(data, extraScope), [data, extraScope]);

  // O rótulo de categoria é desenhado como `<text>` do SVG, onde HTML não
  // entra: interpola e reduz o markdown a texto puro ANTES de plotar. Assim o
  // eixo, o tooltip e o equivalente textual leem exatamente a mesma string.
  const points = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        label: chartPlainText(point.label, scope) || point.label,
      })),
    [data, scope],
  );

  const isEmpty = isPointsEmpty(points);
  const rows = toPointRows(points);
  const radius = hBarRadius(palette);

  /**
   * Cor da barra `index`. §8 pede VERDE80 para a série única; uma cor pedida
   * pelo ponto e o modo "uma cor por categoria" continuam ciclando a paleta.
   */
  const fillAt = (index: number, color?: ChartSeriesColor): string =>
    color || hasColorByCategory ? palette.colorAt(index, color) : palette.primary80;

  /**
   * A mesma cor no DOM (marca do tooltip): `var(--token)` quando vem da paleta,
   * valor resolvido no caso do verde a 80%, que não é um token do ciclo.
   */
  const swatchAt = (index: number, color?: ChartSeriesColor): string =>
    color || hasColorByCategory ? palette.varAt(index, color) : palette.primary80;

  return (
    <ChartFrame
      label={label}
      summary={summary ?? describePoints(points, valueFormatter)}
      height={height}
      scope={scope}
      state={state === 'success' ? undefined : state}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={rows}
          layout="vertical"
          margin={CHART_MARGIN}
          barCategoryGap={categoryGap(palette)}
        >
          {/* Grade do eixo de VALOR — em barra horizontal ele é o X, então as
              guias saem verticais (decisão registrada em NOTAS [SUB-04]). */}
          {showGrid ? (
            <CartesianGrid {...chartGridProps(palette)} vertical horizontal={false} />
          ) : null}
          <XAxis
            type="number"
            tickFormatter={valueFormatter}
            {...chartYAxisProps(palette)}
          />
          <YAxis
            type="category"
            dataKey={CATEGORY_KEY}
            width={categoryWidth}
            {...chartAxisProps(palette)}
          />
          <Tooltip
            cursor={chartBarCursorProps(palette)}
            wrapperStyle={{ outline: 'none' }}
            content={(props) => {
              const entry = props.payload?.[0];
              if (!props.active || !entry) return null;
              const title = chartPlainText(String(props.label ?? ''), scope);
              const index = points.findIndex((point) => point.label === title);
              const point = index >= 0 ? points[index] : undefined;
              return (
                <ChartTooltip
                  title={title}
                  rows={[
                    {
                      label: VALUE_ROW_LABEL,
                      value: valueFormatter(Number(entry.value ?? 0)),
                      color: swatchAt(Math.max(index, 0), point?.color),
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="value"
            radius={radius}
            fill={fillAt(0)}
            strokeWidth={BAR_STROKE_WIDTH}
            // Hover ESCURECE (§4 da configuração base). O recharts não tem
            // filtro de estado: a barra ativa é redesenhada com a cor da
            // própria célula já escurecida.
            activeBar={(bar: ActiveBarShape) => (
              <Rectangle
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                radius={radius}
                strokeWidth={BAR_STROKE_WIDTH}
                fill={darkenColor(bar.fill ?? fillAt(0))}
              />
            )}
            // Entrada de 360ms. O atraso de 120ms da referência é a cascata
            // ENTRE SÉRIES, e este tipo tem uma só — logo, índice 0.
            {...chartAnimationProps(palette, 0)}
          >
            {points.map((point, index) => (
              <Cell key={`${point.label}-${index}`} fill={fillAt(index, point.color)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
