/**
 * Bloco `area_chart` (shape 'series', x temporal) — desenha volume/tendência ao
 * longo do tempo sobre o `AreaChart` de `@/shared/ui`.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — `03-tipos-de-grafico.md` §2 (Área) · lote SUB-02
 * ---------------------------------------------------------------------------
 * [x] 1. Cores na ORDEM do ciclo: 1ª #00A76F, 2ª #FFAB00 — `palette.colorAt(i)`
 *        (`palette="single"` fixa a cor de `accent`, que também é token).
 * [x] 2. Altura 320px — `CHART_HEIGHT.default`, o padrão do `AreaChart`.
 * [x] 3. Legenda LIGADA (`showLegend` default `true`; omitida com série única,
 *        onde não há o que distinguir).
 * [x] 4. Preenchimento em GRADIENTE VERTICAL 0.4 → 0, paradas 0 e 100
 *        (`02-configuracao-base.md` §5) — `<defs><linearGradient>` com id
 *        único por série. `fill="solid"|"none"` continuam disponíveis.
 * [x] 5. Linha 2,5px, curva SUAVE, ponta arredondada, SEM pontos (§6) —
 *        `geometry.lineWidth` / `geometry.curve` / `dot={false}`.
 * [x] 6. Grade SÓ horizontal, tracejada 3 — `chartGridProps`.
 * [x] 7. Eixos sem linha e sem marcações, texto 12px/400 — `chartAxisProps`;
 *        5 divisões no eixo Y — `chartYAxisProps`.
 * [x] 8. Hover ESCURECE (§4) — ponto ativo com `palette.hoverAt(i)`.
 * [x] 9. Tooltip branco 90% com desfoque — `ChartSeriesTooltip`.
 * [x] 10. Animação 360ms com 120ms de atraso por série (§3) —
 *         `chartAnimationProps(palette, i)`.
 * [x] 11. Zero hex/rgb/px de estilo neste arquivo: cor, métrica e tipografia
 *         saem de `useChartPalette` dentro do `AreaChart`.
 * n/a 12. Coluna com raio 4px só no topo (regra de barras).
 *
 * ---------------------------------------------------------------------------
 * CONTRATO COMUM (briefing §5)
 * ---------------------------------------------------------------------------
 *  - CABEÇALHO: desenhado pelo `BlockFrame`. O bloco NÃO repete título dentro
 *    do gráfico;
 *  - DADOS: `data` no shape `series` (`{x, y, series?}`), adaptada aqui para as
 *    séries do gráfico;
 *  - MARKDOWN + `{{interpolação}}`: todo texto que este bloco desenha (rótulo
 *    acessível, legenda da tabela, mensagem de vazio/erro) passa por
 *    `chartPlainText(texto, scope)`, com `scope = buildChartScope(data)`;
 *  - ESTADOS: `loading`/`skeleton` → esqueleto; `error` → aviso de erro;
 *    consulta sem linhas → estado vazio. Tudo do `ChartFrame`;
 *  - PARÂMETROS: `type`, `fill`, `showLegend`, `showGridLines`, `palette`,
 *    `accent` e `valueFormat` continuam com o mesmo nome, tipo e efeito.
 *
 * COR: `accent` continua aceitando o vocabulário antigo (`chart-1`,
 * `bg-purple-500`, `#40E0D0`), traduzido por `chartAccentColor()` para uma cor
 * de token do DS. Cor crua não reconhecida cai na paleta — nunca entra hex no
 * desenho.
 *
 * ACESSIBILIDADE: os rótulos do eixo vivem dentro do SVG, então o bloco publica
 * os mesmos números como tabela (`ChartDataTable`), visível só para leitor de
 * tela.
 *
 * Modos de paleta (`palette`): `single` fixa a cor de `accent` em todas as
 * séries; `multi` e `none` deixam a paleta categórica do DS ciclar — é ela que
 * garante vizinhos distinguíveis.
 */
import type { SeriesData } from '@dashboards/contracts';
import {
  AreaChart,
  ChartDataTable,
  buildChartScope,
  chartAccentColor,
  chartPlainText,
} from '@/shared/ui';
import type { ChartSeries } from '@/shared/ui';
import {
  formatCompactNumberBR,
  formatPercentPointsBR,
  type ValueFormat,
} from '@/shared/lib/format';
import { formatCatalogValue } from '../../lib/value-format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type AreaProps = {
  type?: 'default' | 'stacked' | 'percent';
  fill?: 'gradient' | 'solid' | 'none';
  showLegend?: boolean;
  showGridLines?: boolean;
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor base da(s) série(s). Aceita o enum do catálogo e os valores antigos
   * (classe utilitária, cor CSS); `chartAccentColor()` resolve para token do DS.
   */
  accent?: string;
  /** Formato do valor no tooltip (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/** Legenda da tabela equivalente — aceita Markdown e `{{variáveis}}`. */
const TABLE_CAPTION = `${manifest.name}: valores por período`;

/**
 * Converte o formato longo do contrato (`[{x, y, series}]`) em séries alinhadas
 * ao eixo X. Preserva a ordem de aparição do X — o dado já chega ordenado pela
 * consulta, e reordenar aqui esconderia um erro de query.
 */
export function toAreaSeries(data: SeriesData): {
  series: ChartSeries[];
  labels: string[];
} {
  const points = (data ?? []) as SeriesPoint[];
  const labels: string[] = [];
  const groups = new Map<string, Map<string, number>>();

  for (const point of points) {
    const name = point.series ?? 'Valor';
    const x = String(point.x);
    if (!labels.includes(x)) labels.push(x);
    if (!groups.has(name)) groups.set(name, new Map());
    groups.get(name)!.set(x, point.y ?? 0);
  }

  const series = [...groups.entries()].map(([label, byX]) => ({
    label,
    data: labels.map((x) => byX.get(x) ?? 0),
  }));

  return { series, labels };
}

export const Component: BlockComponent<AreaProps, SeriesData> = ({
  props,
  data,
  state,
  error,
}) => {
  const { series, labels } = toAreaSeries(data ?? []);
  const mode = props.type ?? 'default';
  const isPercent = mode === 'percent';

  // Vocabulário de `{{variáveis}}` derivado dos DADOS — o mesmo em todo bloco.
  const scope = buildChartScope(data ?? []);

  // `single` é o único modo que fixa cor: nos outros a paleta do DS cicla.
  const accent = props.palette === 'single' ? chartAccentColor(props.accent) : undefined;
  const colored = accent ? series.map((item) => ({ ...item, color: accent })) : series;

  // Em `percent` o eixo JÁ é participação: o valor sai em pontos percentuais e
  // o `valueFormat` não se aplica (formatar "42" como R$ contradiria o gráfico).
  const formatValue = (value: number) =>
    isPercent
      ? formatPercentPointsBR(value)
      : formatCatalogValue(value, props.valueFormat);
  const formatAxis = (value: number) =>
    isPercent ? formatPercentPointsBR(value) : formatCompactNumberBR(value);

  return (
    <>
      <AreaChart
        series={colored}
        labels={labels}
        mode={mode}
        fill={props.fill ?? 'gradient'}
        showLegend={props.showLegend !== false && series.length > 1}
        showGrid={props.showGridLines !== false}
        valueFormatter={formatValue}
        axisFormatter={formatAxis}
        state={state === 'error' ? 'error' : undefined}
        isLoading={state === 'loading' || state === 'skeleton'}
        errorMessage={error}
        label={manifest.name}
        scope={scope}
      />
      <ChartDataTable
        caption={chartPlainText(TABLE_CAPTION, scope) || TABLE_CAPTION}
        columns={['Período', ...series.map((item) => item.label)]}
        rows={labels.map((label, index) => [
          label,
          ...series.map((item) => formatValue(item.data[index] ?? 0)),
        ])}
      />
    </>
  );
};

/**
 * Insights de rodapé: pico e vale da série. Retorna `string[]`; o BlockRenderer
 * normaliza para as linhas de insight da moldura.
 */
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

export const definition = defineBlock<AreaProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
