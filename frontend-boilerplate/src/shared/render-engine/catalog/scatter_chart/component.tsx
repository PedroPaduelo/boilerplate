/**
 * Bloco `scatter_chart` (shape 'series', x/y numéricos) — correlação entre duas
 * medidas sobre o `ScatterChart` de `@/shared/ui`.
 *
 * O que mudou na migração:
 *  - legenda, tooltip, eixos, grade e estados vêm da base; sumiram a paleta
 *    própria, o fundo branco fixo e o cinza cravado do cursor;
 *  - COR: a dispersão pinta por CATEGORIA com a paleta do DS — é isso que
 *    separa um grupo do outro. `palette: "single"` junta tudo numa série só
 *    (uma cor), e `accent` continua aceito por compatibilidade (ver manifest);
 *  - o equivalente textual é o resumo do próprio gráfico: uma tabela de
 *    milhares de pontos não ajudaria ninguém a ouvir uma correlação.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — `03-tipos-de-grafico.md` §15 (Dispersão)
 * ---------------------------------------------------------------------------
 * 1. Grade só horizontal, tracejada 3 ......... `chartGridProps(palette)`; a
 *    grade vertical que este bloco desenhava foi removida (base §7).
 * 2. Eixos sem linha e sem marcações .......... `chartAxisProps` /
 *    `chartYAxisProps` (Y com as 5 divisões da base).
 * 3. Texto dos eixos 12px/400/#919EAB ......... vem de `chartAxisProps`.
 * 4. Linhas 2,5px sem pontos .................. N/A (dispersão não tem linha);
 *    o que vale aqui é o MARCADOR de 6px de DIÂMETRO
 *    (`geometry.markerVisibleSize`), que o recharts recebe como ÁREA —
 *    `π·(d/2)²`, via `chartMarkerArea`. A conta antiga era `π·d²`: quatro
 *    vezes a área, ponto de 12px, o dobro do da linha na mesma grade.
 * 5. Coluna raio 4px/largura 48% .............. N/A (não há coluna).
 * 6. Hover ESCURECE ........................... `activeShape` com
 *    `palette.hoverAt(i)`.
 * 7. Tooltip branco 90% com blur .............. `ChartTooltip` da base.
 * + Altura 350px (`CHART_HEIGHT.scatter`), eixo X com 8 divisões e 1 casa
 *   decimal, legenda ligada, animação 360ms com 120ms por série.
 * + Contrato comum: rótulos de eixo e mensagem de vazio aceitam Markdown e
 *   `{{variavel}}`, com escopo de `buildChartScope(data)`.
 * ⚠️ ZOOM `xy` (§15) — não entregue: o recharts não tem equivalente nativo e
 *   trocar de biblioteca está fora de escopo. Registrado em `docs/charts/NOTAS.md`
 *   e `docs/charts/PEDIDOS-BASE.md` (`[SUB-07]`).
 */
import type { SeriesData } from '@dashboards/contracts';
import { ScatterChart, buildChartScope } from '@/shared/ui';
import type { ScatterPoint } from '@/shared/ui';
import { formatCompactNumberBR, formatNumberBR } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ScatterProps = {
  showLegend?: boolean;
  showGridLines?: boolean;
  palette?: 'single' | 'multi' | 'none';
  /** Aceito por compatibilidade; a cor sai da paleta categórica do DS. */
  accent?: string;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/** Rótulo usado quando o dado não nomeia a série. */
const DEFAULT_CATEGORY = 'Série';

export const Component: BlockComponent<ScatterProps, SeriesData> = ({
  props,
  data,
  state,
  error,
}) => {
  const points = (data ?? []) as SeriesPoint[];
  // `single` = uma cor só: colapsamos as categorias numa série, em vez de
  // pintar grupos diferentes com a mesma cor (o que esconderia o agrupamento).
  const isSingle = props.palette === 'single';

  const rows: ScatterPoint[] = points.map((point) => ({
    x: Number(point.x),
    y: point.y ?? 0,
    category: isSingle ? DEFAULT_CATEGORY : (point.series ?? DEFAULT_CATEGORY),
  }));

  return (
    <ScatterChart
      data={rows}
      // Vocabulário de `{{variaveis}}` derivado dos dados DO BLOCO (com os
      // nomes de série), não dos pontos já achatados.
      scope={buildChartScope(data ?? [])}
      showLegend={props.showLegend !== false}
      showGrid={props.showGridLines !== false}
      valueFormatter={formatNumberBR}
      // O eixo X fica com a 1 casa decimal do §15; só o Y vira compacto, que é
      // onde o rótulo longo estoura a largura reservada.
      yAxisFormatter={formatCompactNumberBR}
      isLoading={state === 'loading' || state === 'skeleton'}
      state={state === 'error' ? 'error' : undefined}
      errorMessage={error}
      label={manifest.name}
    />
  );
};

/** Insights de rodapé: tamanho da nuvem e ponto mais alto. */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const categories = new Set(points.map((point) => point.series ?? DEFAULT_CATEGORY));
  const insights = [
    `${points.length} pontos em ${categories.size} ${categories.size === 1 ? 'série' : 'séries'}`,
  ];

  const top = points.reduce((best, p) => ((p.y ?? 0) > (best.y ?? 0) ? p : best));
  if ((top.y ?? 0) > 0) {
    insights.push(
      `Maior correlação: (${formatNumberBR(Number(top.x))}, ${formatNumberBR(top.y ?? 0)})`,
    );
  }

  return insights;
}

export const definition = defineBlock<ScatterProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
