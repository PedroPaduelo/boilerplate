/**
 * Bloco `spark_chart` (shape 'series') — minigráfico de tendência sobre o
 * `SparkChart` de `@/shared/ui`. Sem eixos, sem grade, sem tooltip: é o
 * desenho que acompanha um número, não um gráfico para ler valor.
 *
 * O que mudou na migração:
 *  - a base tem UM caminho de cor (token de série), no lugar dos três do legado
 *    (`accent`, `style` cru e gradiente arco-íris);
 *  - COR: `accent` continua aceitando o vocabulário antigo e vira token do DS;
 *  - ACESSIBILIDADE: sem eixo, o texto é a ÚNICA leitura possível — o bloco
 *    publica a série como tabela para leitor de tela, além do rótulo do
 *    gráfico.
 */
import type { SeriesData } from '@dashboards/contracts';
import { ChartDataTable, SparkChart, chartAccentColor } from '@/shared/ui';
import { formatCompactNumberBR } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SparkProps = {
  type?: 'area' | 'bar' | 'line';
  curveType?: 'linear' | 'monotone' | 'step';
  palette?: 'single' | 'multi' | 'none';
  /** Cor da série; resolvida para token do DS. */
  accent?: string;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/** Altura do minigráfico em px — geometria do desenho, não espaçamento. */
const SPARK_HEIGHT = 80;

/** Rótulo acessível: sem eixo nem legenda, é a única descrição do desenho. */
const SPARK_LABEL = 'Minigráfico de tendência';

export const Component: BlockComponent<SparkProps, SeriesData> = ({
  props,
  data,
  state,
  error,
}) => {
  const points = (data ?? []) as SeriesPoint[];
  const values = points.map((point) => point.y ?? 0);

  // `multi` era o gradiente arco-íris do legado: numa série só, cor não carrega
  // informação nenhuma. Nesse modo a série usa a primeira cor da paleta.
  const accent = props.palette === 'multi' ? undefined : chartAccentColor(props.accent);

  return (
    <>
      <SparkChart
        data={values}
        type={props.type ?? 'area'}
        color={accent}
        height={SPARK_HEIGHT}
        isSmooth={(props.curveType ?? 'monotone') === 'monotone'}
        label={SPARK_LABEL}
        isLoading={state === 'loading' || state === 'skeleton'}
        emptyMessage={
          state === 'error' ? (error ?? 'Erro ao carregar os dados') : undefined
        }
      />
      <ChartDataTable
        caption={`${manifest.name}: valores da série`}
        columns={['Ponto', 'Valor']}
        rows={points.map((point, index) => [
          String(point.x ?? index + 1),
          formatCompactNumberBR(point.y ?? 0),
        ])}
      />
    </>
  );
};

/** Insights de rodapé: direção da tendência e alcance dos valores. */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const values = points.map((point) => point.y ?? 0);
  const first = values[0];
  const last = values[values.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (first === 0 && last !== 0) {
    return [
      `Tendência: alta (de 0 para ${formatCompactNumberBR(last)})`,
      `Faixa: ${formatCompactNumberBR(min)}–${formatCompactNumberBR(max)}`,
    ];
  }

  // Variação do primeiro ao último ponto, limitada para não virar "9999%" num
  // outlier — o número aqui é leitura rápida, não análise.
  const delta =
    first === 0
      ? 0
      : Math.max(-999, Math.min(999, ((last - first) / Math.abs(first)) * 100));
  const direction = Math.abs(delta) < 0.5 ? 'estável' : delta > 0 ? 'alta' : 'queda';

  const insights = [
    `Tendência: ${direction} (${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`,
  ];
  if (points.length > 1) {
    insights.push(`Faixa: ${formatCompactNumberBR(min)}–${formatCompactNumberBR(max)}`);
  }
  return insights;
}

export const definition = defineBlock<SparkProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
