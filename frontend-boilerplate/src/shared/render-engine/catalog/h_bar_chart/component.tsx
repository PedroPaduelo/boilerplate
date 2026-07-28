/**
 * Bloco `h_bar_chart` (shape 'series', x categórico) — barras horizontais sobre
 * o `HBarChart` de `@/shared/ui`. É a forma certa quando o rótulo da categoria
 * é longo: ele cabe no eixo em vez de virar reticências.
 *
 * O que mudou na migração:
 *  - a escala, o eixo de categorias, o tooltip e os estados vêm da base — saiu
 *    a pilha de `<div>`s com largura em `%` e o esmaecimento manual no hover;
 *  - COR: `accent` continua aceitando o vocabulário antigo, mas vira token de
 *    dado do DS; em `palette: "multi"` a paleta categórica cicla por barra;
 *  - ACESSIBILIDADE: as categorias vivem dentro do SVG, então o bloco publica
 *    os mesmos números como tabela para leitor de tela.
 */
import type { SeriesData } from '@dashboards/contracts';
import { ChartDataTable, HBarChart, chartAccentColor } from '@/shared/ui';
import type { ChartPoint } from '@/shared/ui';
import { type ValueFormat } from '@/shared/lib/format';
import { formatCatalogValue } from '../../lib/value-format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type HBarProps = {
  palette?: 'single' | 'multi' | 'none';
  /** Cor das barras em palette="single"; resolvida para token do DS. */
  accent?: string;
  /** Formato do valor no eixo e no tooltip (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<HBarProps, SeriesData> = ({
  props,
  data,
  state,
  error,
}) => {
  const points = (data ?? []) as SeriesPoint[];
  const formatValue = (value: number) => formatCatalogValue(value, props.valueFormat);

  // `single` fixa a cor de destaque; `multi` cicla a paleta por categoria.
  const accent = props.palette === 'single' ? chartAccentColor(props.accent) : undefined;
  const chartData: ChartPoint[] = points.map((point) => ({
    label: String(point.x),
    value: point.y ?? 0,
    color: accent,
  }));

  return (
    <>
      <HBarChart
        data={chartData}
        hasColorByCategory={props.palette === 'multi'}
        valueFormatter={formatValue}
        isLoading={state === 'loading' || state === 'skeleton'}
        emptyMessage={
          state === 'error' ? (error ?? 'Erro ao carregar os dados') : undefined
        }
        label={manifest.name}
      />
      <ChartDataTable
        caption={`${manifest.name}: valor por categoria`}
        columns={['Categoria', 'Valor']}
        rows={chartData.map((point) => [point.label, formatValue(point.value)])}
      />
    </>
  );
};

/**
 * Insights de rodapé: maior e menor categoria. Formata pelo MESMO `valueFormat`
 * do bloco — o insight repete o número que a barra mostra, e as duas leituras
 * não podem discordar na unidade.
 */
function deriveTakeaway(data: SeriesData, props: HBarProps = {}): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const format = (value: number) => formatCatalogValue(value, props.valueFormat);
  const top = points.reduce((best, p) => ((p.y ?? 0) > (best.y ?? 0) ? p : best));
  if ((top.y ?? 0) <= 0) return undefined;

  const insights = [`Maior: ${String(top.x)} (${format(top.y ?? 0)})`];

  if (points.length > 1) {
    const bottom = points.reduce((best, p) => ((p.y ?? 0) < (best.y ?? 0) ? p : best));
    if ((bottom.y ?? 0) > 0 && bottom !== top) {
      insights.push(`Menor: ${String(bottom.x)} (${format(bottom.y ?? 0)})`);
    }
  }

  return insights;
}

export const definition = defineBlock<HBarProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
