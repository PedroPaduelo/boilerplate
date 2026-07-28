/**
 * Bloco `line_chart` (shape 'series', x temporal) — tendência ao longo do
 * tempo sobre o `LineChart` de `@/shared/ui`.
 *
 * O que mudou na migração:
 *  - eixos, grade, tooltip, legenda e os estados (carregando / sem dados) vêm
 *    prontos da base; aqui só adaptamos o contrato `{x, y, series?}`;
 *  - COR: `accent` continua aceitando o vocabulário antigo, mas passa por
 *    `chartAccentColor()` e vira token de dado do DS. Cor crua não
 *    reconhecida cai na paleta — nenhum hex atravessa;
 *  - ACESSIBILIDADE: os rótulos do eixo X vivem dentro do SVG, então o bloco
 *    publica os mesmos números como tabela (`ChartDataTable`) para leitor de
 *    tela.
 */
import type { SeriesData } from '@dashboards/contracts';
import { ChartDataTable, LineChart, chartAccentColor } from '@/shared/ui';
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
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/**
 * Achata o formato longo do contrato em séries alinhadas ao eixo X, na ordem
 * de aparição (a consulta é quem ordena; reordenar aqui esconderia erro dela).
 */
export function toLineSeries(data: SeriesData): {
  series: ChartSeries[];
  labels: string[];
} {
  const points = (data ?? []) as SeriesPoint[];
  const labels: string[] = [];
  const groups = new Map<string, Map<string, number>>();

  for (const point of points) {
    const name = point.series ?? 'Série';
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

export const Component: BlockComponent<LineProps, SeriesData> = ({
  props,
  data,
  state,
  error,
}) => {
  const { series, labels } = toLineSeries(data ?? []);
  const formatValue =
    props.valueFormatter ??
    ((value: number) => formatCatalogValue(value, props.valueFormat));

  // `single` é o único modo que fixa cor; nos demais a paleta do DS cicla.
  const accent = props.palette === 'single' ? chartAccentColor(props.accent) : undefined;
  const colored = accent ? series.map((item) => ({ ...item, color: accent })) : series;

  return (
    <>
      <LineChart
        series={colored}
        labels={labels}
        isSmooth={props.smooth === true}
        showArea={props.area !== false}
        showLegend={series.length > 1}
        valueFormatter={formatValue}
        axisFormatter={formatCompactNumberBR}
        isLoading={state === 'loading' || state === 'skeleton'}
        emptyMessage={
          state === 'error' ? (error ?? 'Erro ao carregar os dados') : undefined
        }
        label={manifest.name}
      />
      <ChartDataTable
        caption={`${manifest.name}: valores por período`}
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
