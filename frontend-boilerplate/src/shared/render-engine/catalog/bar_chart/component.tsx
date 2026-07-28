/**
 * Bloco `bar_chart` (shape 'series') — compara categorias em barras verticais
 * (`BarChart`) ou horizontais (`HBarChart`), ambos de `@/shared/ui`.
 *
 * O que mudou na migração:
 *  - a plotagem, os eixos, o tooltip, a legenda e os estados vêm da base; o
 *    bloco só adapta o contrato (`bar-series.ts`) e decide a cor
 *    (`bar-colors.ts`) — por isso o arquivo cabe numa tela;
 *  - COR: `accent` e `seriesColors` continuam aceitando o vocabulário antigo,
 *    mas viram token de dado do DS. Nenhum hex atravessa;
 *  - EMPILHAMENTO: segue exigindo dado multi-série e orientação vertical, e
 *    degrada para barras planas quando falta um dos dois — igual a antes;
 *  - ACESSIBILIDADE: as categorias do eixo vivem dentro do SVG, então o bloco
 *    publica os mesmos números como tabela para leitor de tela.
 */
import type { SeriesData } from '@dashboards/contracts';
import { BarChart, ChartDataTable, HBarChart } from '@/shared/ui';
import { type ValueFormat } from '@/shared/lib/format';
import { formatCatalogValue } from '../../lib/value-format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { barColorAt, isColorByCategory } from './bar-colors';
import { toBarPoints, toBarSeries, type BarPoint } from './bar-series';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BarProps = {
  /** Empilha as séries. Requer dado multi-série e orientação vertical. */
  stacked?: boolean;
  orientation?: 'vertical' | 'horizontal';
  /** Cor base das barras (palette="single"), resolvida para token do DS. */
  accent?: string;
  palette?: 'single' | 'multi' | 'none';
  /** Cor por série, na ordem; vence o modo de paleta. */
  seriesColors?: string[];
  /** Formato do valor exibido (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
  /** Override programático do formatador (fora do schema). */
  valueFormatter?: (value: number) => string;
};

export const Component: BlockComponent<BarProps, SeriesData> = ({
  props,
  data,
  state,
  error,
}) => {
  const isLoading = state === 'loading' || state === 'skeleton';
  const emptyMessage =
    state === 'error' ? (error ?? 'Erro ao carregar os dados') : undefined;
  const formatValue =
    props.valueFormatter ??
    ((value: number) => formatCatalogValue(value, props.valueFormat));

  // ----- HORIZONTAL: uma barra por linha do dado (não empilha) -----
  if (props.orientation === 'horizontal') {
    const points = toBarPoints(data ?? []).map((point, index) => ({
      ...point,
      color: barColorAt(index, props),
    }));
    return (
      <>
        <HBarChart
          data={points}
          hasColorByCategory={props.palette === 'multi'}
          valueFormatter={formatValue}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          label={manifest.name}
        />
        <ChartDataTable
          caption={`${manifest.name}: valor por categoria`}
          columns={['Categoria', 'Valor']}
          rows={points.map((point) => [point.label, formatValue(point.value)])}
        />
      </>
    );
  }

  // ----- VERTICAL: séries agrupadas ou empilhadas -----
  const { series, labels, hasNamedSeries } = toBarSeries(data ?? []);
  const byCategory = isColorByCategory(series.length, props.palette);
  const colored = series.map((item, index) => ({
    ...item,
    color: barColorAt(index, props),
  }));

  return (
    <>
      <BarChart
        series={colored}
        labels={labels}
        isStacked={props.stacked === true && hasNamedSeries}
        hasColorByCategory={byCategory}
        showLegend={series.length > 1 || byCategory}
        valueFormatter={formatValue}
        axisFormatter={formatValue}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        label={manifest.name}
      />
      <ChartDataTable
        caption={`${manifest.name}: valor por categoria`}
        columns={['Categoria', ...series.map((item) => item.label)]}
        rows={labels.map((label, index) => [
          label,
          ...series.map((item) => formatValue(item.data[index] ?? 0)),
        ])}
      />
    </>
  );
};

/**
 * Insights de rodapé: maior e menor valor da série. Formata pelo MESMO
 * `valueFormat` do bloco — o insight repete o número que a barra mostra, e as
 * duas leituras não podem discordar na unidade.
 */
function deriveTakeaway(data: SeriesData, props: BarProps = {}): string[] | undefined {
  const points = (data ?? []) as BarPoint[];
  if (points.length === 0) return undefined;

  const format =
    props.valueFormatter ??
    ((value: number) => formatCatalogValue(value, props.valueFormat));
  const top = points.reduce((best, p) => ((p.y ?? 0) > (best.y ?? 0) ? p : best));
  if ((top.y ?? 0) <= 0) return undefined;

  const insights = [`Maior valor: ${String(top.x)} (${format(top.y ?? 0)})`];

  if (points.length > 1) {
    const bottom = points.reduce((best, p) => ((p.y ?? 0) < (best.y ?? 0) ? p : best));
    if ((bottom.y ?? 0) > 0 && bottom !== top) {
      insights.push(`Menor valor: ${String(bottom.x)} (${format(bottom.y ?? 0)})`);
    }
  }

  return insights;
}

export const definition = defineBlock<BarProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
