/**
 * Bloco `line_chart` (shape 'series', x temporal) — tendência ao longo do
 * tempo sobre o `LineChart` de `@/shared/ui`.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — `03-tipos-de-grafico.md` §1 (Linha)
 * ---------------------------------------------------------------------------
 *  1. Grade só horizontal, tracejada 3 ....... `chartGridProps(palette)`
 *  2. Eixos sem linha e sem marcações ........ `chartAxisProps` / `chartYAxisProps`
 *  3. Texto dos eixos 12px/400/#919EAB ....... `chartAxisProps` (tipografia do tema)
 *  4. Linha 2,5px em curva suave ............. `palette.geometry.lineWidth` + `curve`
 *     …com marcadores VISÍVEIS ............... a §1 SOBRESCREVE a base (que os esconde):
 *        6px de DIÂMETRO (`r` = 3) e halo de 1,5px, ambos de `chartMarkerProps`.
 *        O token `markerVisibleSize` é diâmetro; este bloco o passava direto
 *        como raio e desenhava um ponto de 12px — o dobro do mini-gráfico.
 *  5. Coluna com raio 4px .................... não se aplica (tipo linha)
 *  6. Hover ESCURECE ......................... `activeDot` com a cor escurecida
 *  7. Tooltip branco 90% com blur ............ `ChartSeriesTooltip` → `ChartTooltip`
 *  +  altura 320px (`CHART_HEIGHT.default`), legenda ligada, eixo X de
 *     categorias, animação 360ms com 120ms de atraso por série.
 *
 * ---------------------------------------------------------------------------
 * CONTRATO COMUM (briefing §5)
 * ---------------------------------------------------------------------------
 *  - CABEÇALHO: quem desenha título/subtítulo/descrição/badge é o `BlockFrame`;
 *    o bloco não desenha um segundo título dentro do gráfico.
 *  - DADOS: `data` alimenta o desenho E o escopo de `{{variaveis}}`
 *    (`buildChartScope(data)`), passado ao gráfico.
 *  - TEXTO: mensagem de vazio, rótulo acessível e legenda da tabela equivalente
 *    passam por `chartPlainText(texto, scope)`. Rótulo vindo do DADO (nome de
 *    série, categoria do eixo) só é interpolado quando traz `{{variavel}}` —
 *    senão `pix_enviado` perderia o underscore para o markdown.
 *  - ESTADOS: `loading`/`skeleton` → esqueleto; `error` → aviso de erro (e não
 *    "sem dados"); sem linhas → estado vazio. Tudo via `ChartFrame`.
 *  - COR: `accent` continua aceitando o vocabulário antigo, mas passa por
 *    `chartAccentColor()` e vira token de dado do DS. Cor crua não reconhecida
 *    cai na paleta — nenhum hex atravessa.
 *  - ACESSIBILIDADE: os rótulos do eixo X vivem dentro do SVG, então o bloco
 *    publica os mesmos números como tabela (`ChartDataTable`) para leitor de
 *    tela.
 */
import type { SeriesData } from '@dashboards/contracts';
import {
  ChartDataTable,
  LineChart,
  buildChartScope,
  chartAccentColor,
  chartPlainText,
} from '@/shared/ui';
import type { ChartSeries } from '@/shared/ui';
import { formatCompactNumberBR, type ValueFormat } from '@/shared/lib/format';
import { formatCatalogValue } from '../../lib/value-format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type LineProps = {
  smooth?: boolean;
  area?: boolean;
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor base da(s) série(s). Aceita o enum do catálogo e os valores antigos
   * (classe utilitária, cor CSS); resolvida para token do DS.
   */
  accent?: string;
  /** Formato do valor no tooltip (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
  /** Override programático do formato do valor no tooltip (fora do schema). */
  valueFormatter?: (value: number) => string;
  /**
   * Override programático da mensagem de vazio (fora do schema, como
   * `valueFormatter`). Aceita Markdown e `{{variaveis}}` dos dados.
   */
  emptyMessage?: string;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/**
 * Achata o formato longo do contrato em séries alinhadas ao eixo X, na ordem
 * de aparição (a consulta é quem ordena; reordenar aqui esconderia erro dela).
 *
 * `isNamed` diz se os pontos trouxeram o campo `series`: sem ele, o rótulo é o
 * genérico "Série" e uma legenda de um item só repetiria o título do card.
 */
export function toLineSeries(data: SeriesData): {
  series: ChartSeries[];
  labels: string[];
  isNamed: boolean;
} {
  const points = (data ?? []) as SeriesPoint[];
  const labels: string[] = [];
  const groups = new Map<string, Map<string, number>>();
  let isNamed = false;

  for (const point of points) {
    const name = point.series ?? 'Série';
    if (point.series != null && point.series !== '') isNamed = true;
    const x = String(point.x);
    if (!labels.includes(x)) labels.push(x);
    if (!groups.has(name)) groups.set(name, new Map());
    groups.get(name)!.set(x, point.y ?? 0);
  }

  const series = [...groups.entries()].map(([label, byX]) => ({
    label,
    data: labels.map((x) => byX.get(x) ?? 0),
  }));

  return { series, labels, isNamed };
}

export const Component: BlockComponent<LineProps, SeriesData> = ({
  props,
  data,
  state,
  error,
}) => {
  const { series, labels, isNamed } = toLineSeries(data ?? []);
  const scope = buildChartScope(data ?? []);
  const formatValue =
    props.valueFormatter ??
    ((value: number) => formatCatalogValue(value, props.valueFormat));

  // `single` é o único modo que fixa cor; nos demais a paleta do DS cicla —
  // e a 1ª série recebe o verde a 80% da §1.
  const accent = props.palette === 'single' ? chartAccentColor(props.accent) : undefined;
  const colored = accent ? series.map((item) => ({ ...item, color: accent })) : series;

  return (
    <>
      <LineChart
        series={colored}
        labels={labels}
        scope={scope}
        isSmooth={props.smooth !== false}
        showArea={props.area !== false}
        // §1: legenda ligada. Série única SEM nome próprio não ganha legenda —
        // o rótulo seria o genérico "Série", repetindo o título do card.
        showLegend={series.length > 1 || isNamed}
        valueFormatter={formatValue}
        axisFormatter={formatCompactNumberBR}
        state={state === 'error' ? 'error' : undefined}
        isLoading={state === 'loading' || state === 'skeleton'}
        errorMessage={error}
        emptyMessage={props.emptyMessage}
        label={manifest.name}
      />
      <ChartDataTable
        caption={chartPlainText(`${manifest.name}: valores por período`, scope)}
        columns={['Período', ...series.map((item) => item.label)]}
        rows={labels.map((label, index) => [
          label,
          ...series.map((item) => formatValue(item.data[index] ?? 0)),
        ])}
      />
    </>
  );
};

/** Insights de rodapé: pico e vale da série. */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const top = points.reduce((best, p) => ((p.y ?? 0) > (best.y ?? 0) ? p : best));
  if ((top.y ?? 0) <= 0) return undefined;

  const insights = [`Pico: ${String(top.x)} (${formatCompactNumberBR(top.y ?? 0)})`];

  if (points.length > 1) {
    const bottom = points.reduce((best, p) => ((p.y ?? 0) < (best.y ?? 0) ? p : best));
    if ((bottom.y ?? 0) > 0 && bottom !== top) {
      insights.push(
        `Vale: ${String(bottom.x)} (${formatCompactNumberBR(bottom.y ?? 0)})`,
      );
    }
  }

  return insights;
}

export const definition = defineBlock<LineProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
