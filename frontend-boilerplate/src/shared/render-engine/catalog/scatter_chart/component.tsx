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
 */
import type { SeriesData } from '@dashboards/contracts';
import { ScatterChart } from '@/shared/ui';
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
      showLegend={props.showLegend !== false}
      showGrid={props.showGridLines !== false}
      valueFormatter={formatNumberBR}
      axisFormatter={formatCompactNumberBR}
      isLoading={state === 'loading' || state === 'skeleton'}
      emptyMessage={
        state === 'error' ? (error ?? 'Erro ao carregar os dados') : undefined
      }
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
