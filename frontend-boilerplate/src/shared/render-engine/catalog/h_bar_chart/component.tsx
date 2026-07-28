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
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — `03-tipos-de-grafico.md` §8 (Barra horizontal)
 * ---------------------------------------------------------------------------
 *  1. Grade só do eixo de VALOR, tracejada 3 ....... `chartGridProps` (vertical
 *     aqui: em barra horizontal o eixo de valor é o X — NOTAS [SUB-04])
 *  2. Eixos sem linha e sem marcações .............. `chartAxisProps` /
 *     `chartYAxisProps` (5 divisões no eixo de valor)
 *  3. Texto dos eixos 12px/400/#919EAB ............. `chartAxisProps`
 *  4. Linha 2,5px/curva suave/sem pontos ........... n/a (tipo sem linha)
 *  5. Barra 30% da faixa, raio 2px SÓ NA PONTA ..... `geometry.hBarWidth` +
 *     `geometry.barRadiusFlat` em `[0, r, r, 0]`; traço 0
 *  6. Hover ESCURECE ............................... `activeBar` + `darkenColor`
 *  7. Tooltip branco 90% com blur .................. `ChartTooltip`
 *  + cor VERDE80 (`palette.primary80`), altura 320px, entrada 360ms.
 *
 * CONTRATO COMUM: cabeçalho no `BlockFrame` (o gráfico não desenha um segundo
 * título); dados em `data`; todo texto desenhado passa por `chartPlainText`
 * com o escopo de `buildChartScope(data)`; estados no `ChartFrame`.
 */
import type { SeriesData } from '@dashboards/contracts';
import {
  ChartDataTable,
  HBarChart,
  buildChartScope,
  chartAccentColor,
  chartPlainText,
} from '@/shared/ui';
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

/** Legenda da tabela textual equivalente (aceita `{{variáveis}}` dos dados). */
const TABLE_CAPTION = `${manifest.name}: valor por categoria`;

/** Cabeçalhos da tabela textual equivalente. */
const TABLE_COLUMNS = ['Categoria', 'Valor'];

export const Component: BlockComponent<HBarProps, SeriesData> = ({
  props,
  data,
  state,
  error,
}) => {
  const points = (data ?? []) as SeriesPoint[];
  const formatValue = (value: number) => formatCatalogValue(value, props.valueFormat);

  // Vocabulário de `{{interpolação}}` do bloco: sai dos DADOS já resolvidos, e
  // é o MESMO escopo que o gráfico usa nos rótulos e na mensagem de vazio.
  const scope = buildChartScope(points);

  // `single` fixa a cor de destaque; `multi` cicla a paleta por categoria.
  const accent = props.palette === 'single' ? chartAccentColor(props.accent) : undefined;
  const chartData: ChartPoint[] = points.map((point) => ({
    label: chartPlainText(String(point.x), scope) || String(point.x),
    value: point.y ?? 0,
    color: accent,
  }));

  return (
    <>
      <HBarChart
        data={chartData}
        hasColorByCategory={props.palette === 'multi'}
        valueFormatter={formatValue}
        scope={scope}
        isLoading={state === 'loading' || state === 'skeleton'}
        state={state === 'error' ? 'error' : undefined}
        errorMessage={error}
        label={manifest.name}
      />
      <ChartDataTable
        caption={chartPlainText(TABLE_CAPTION, scope)}
        columns={TABLE_COLUMNS}
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
