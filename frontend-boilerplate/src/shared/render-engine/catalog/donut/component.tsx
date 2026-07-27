/**
 * Bloco `donut` (shape 'categorical') — composição de um total sobre o
 * `DonutChart` de `@/shared/ui`, com a leitura numérica na legenda própria
 * (`donut-legend.tsx`).
 *
 * O que mudou na migração:
 *  - o anel, o tooltip, a leitura central e os estados vêm da base; sumiram o
 *    `strokeDasharray` à mão, o hover manual e o ramp de opacidade;
 *  - COR: `accent` continua aceitando o vocabulário antigo, mas vira token de
 *    dado do DS. Em `palette: "multi"` a paleta categórica cicla — é ela que
 *    garante fatias vizinhas distinguíveis;
 *  - a legenda com valor e percentual (o que o legado tinha de melhor) ficou,
 *    agora como lista de texto legível por leitor de tela — por isso o bloco
 *    não precisa de tabela oculta.
 */
import type { CategoricalData } from '@dashboards/contracts';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { DonutChart, chartAccentColor } from '@/shared/ui';
import type { ChartPoint } from '@/shared/ui';
import {
  formatPercentBR,
  formatValueByEnum,
  type ValueFormat,
} from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { DonutLegend } from './donut-legend';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DonutProps = {
  showLegend?: boolean;
  centerLabel?: string;
  palette?: 'single' | 'multi' | 'none';
  /** Cor das fatias em palette="single"; resolvida para token do DS. */
  accent?: string;
  /** Formato do valor no centro e na legenda (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
};

/** Elemento de `CategoricalData` anotado localmente (no FE resolve p/ any). */
type CategoryPoint = { label: string; value: number | null };

/** Largura reservada ao anel — geometria do desenho, não espaçamento. */
const RING_WIDTH = 220;
const RING_HEIGHT = 200;

export const Component: BlockComponent<DonutProps, CategoricalData> = ({
  props,
  data,
  state,
  error,
}) => {
  const items = (data ?? []) as CategoryPoint[];
  const formatValue = (value: number) =>
    formatValueByEnum(value, props.valueFormat ?? 'compactBRL');

  // `single` pinta todas as fatias com a cor de destaque; nos demais modos a
  // paleta categórica do DS cicla (é o que distingue uma fatia da outra).
  const accent = props.palette === 'single' ? chartAccentColor(props.accent) : undefined;
  const points: ChartPoint[] = items.map((item) => ({
    label: item.label,
    value: item.value ?? 0,
    color: accent,
  }));

  const total = points.reduce((sum, point) => sum + point.value, 0);
  const showLegend = props.showLegend !== false;

  return (
    <HStack gap={5} hAlign="center" vAlign="center" wrap="wrap" width="100%">
      <VStack width={RING_WIDTH}>
        <DonutChart
          data={points}
          height={RING_HEIGHT}
          centerValue={formatValue(total)}
          centerCaption={props.centerLabel ?? 'Total'}
          showLegend={false}
          valueFormatter={formatValue}
          isLoading={state === 'loading' || state === 'skeleton'}
          emptyMessage={
            state === 'error' ? (error ?? 'Erro ao carregar os dados') : undefined
          }
          label={manifest.name}
        />
      </VStack>
      {showLegend ? (
        <DonutLegend data={points} total={total} valueFormatter={formatValue} />
      ) : null}
    </HStack>
  );
};

/** Insights de rodapé: maior e menor fatia, em participação no total. */
function deriveTakeaway(data: CategoricalData): string[] | undefined {
  const items = (data ?? []) as CategoryPoint[];
  if (items.length === 0) return undefined;

  const total = items.reduce((sum, item) => sum + (item.value ?? 0), 0) || 1;
  const top = items.reduce((best, item) =>
    (item.value ?? 0) > (best.value ?? 0) ? item : best,
  );
  if ((top.value ?? 0) <= 0) return undefined;

  const insights = [
    `Maior fatia: ${top.label} (${formatPercentBR((top.value ?? 0) / total)})`,
  ];

  if (items.length > 1) {
    const bottom = items.reduce((best, item) =>
      (item.value ?? 0) < (best.value ?? 0) ? item : best,
    );
    if ((bottom.value ?? 0) > 0 && bottom !== top) {
      insights.push(
        `Menor fatia: ${bottom.label} (${formatPercentBR((bottom.value ?? 0) / total)})`,
      );
    }
  }

  return insights;
}

export const definition = defineBlock<DonutProps, CategoricalData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
