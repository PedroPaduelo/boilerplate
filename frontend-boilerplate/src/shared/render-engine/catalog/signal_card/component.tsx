/**
 * Bloco `signal_card` (shape 'series') — destaca o ÚLTIMO valor da série, a
 * variação e a tendência. Desenha o próprio cartão (`signal-card.tsx`), por
 * isso não recebe a moldura de gráfico.
 *
 * O que mudou na migração:
 *  - o cartão foi reescrito sobre o design system; sumiram o verde/vermelho
 *    cravados do selo de variação (agora é o selo da base, que colore pela
 *    leitura de negócio) e a sparkline com cor por classe;
 *  - COR: `accent` continua aceitando o vocabulário antigo e vira token de dado
 *    do DS;
 *  - o valor continua formatado por `valueFormat` e a tendência, calculada pela
 *    base escolhida em `trendBasis`.
 */
import type { SeriesData } from '@dashboards/contracts';
import { chartAccentColor } from '@/shared/ui';
import { formatValueByEnum, type ValueFormat } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { SignalCard } from './signal-card';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SignalProps = {
  label?: string;
  /** Formato PT-BR do valor em destaque (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
  /** Cor da tendência; resolvida para token de dado do DS. */
  accent?: string;
  /** Subir é bom (verde) ou ruim (vermelho). */
  trendPolarity?: 'up-good' | 'up-bad';
  /** Base do cálculo da tendência. */
  trendBasis?: 'first-vs-last' | 'prev-vs-last';
  /** Mostra a tendência desenhada. */
  showSparkline?: boolean;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/**
 * Variação como fração. `prev-vs-last` compara com o ponto anterior (o
 * movimento recente); `first-vs-last`, com o começo do período. Sem base válida
 * — série curta ou base zero — não há variação: um "+∞%" seria pior que nada.
 */
function computeTrend(
  values: number[],
  basis: 'first-vs-last' | 'prev-vs-last',
): number | undefined {
  if (values.length < 2) return undefined;
  const last = values[values.length - 1];
  const base = basis === 'prev-vs-last' ? values[values.length - 2] : values[0];
  if (base === 0) return undefined;
  return (last - base) / Math.abs(base);
}

export const Component: BlockComponent<SignalProps, SeriesData> = ({
  props,
  data,
  state,
}) => {
  const points = (data ?? []) as SeriesPoint[];
  const values = points.map((point) => point.y ?? 0);
  const last = values.length > 0 ? values[values.length - 1] : null;

  return (
    <SignalCard
      label={props.label ?? 'Sinal'}
      value={formatValueByEnum(last, props.valueFormat ?? 'compactNumber')}
      data={values}
      trend={computeTrend(values, props.trendBasis ?? 'prev-vs-last')}
      higherIsBetter={(props.trendPolarity ?? 'up-good') === 'up-good'}
      showSparkline={props.showSparkline ?? true}
      color={chartAccentColor(props.accent)}
      isLoading={state === 'loading' || state === 'skeleton'}
    />
  );
};

export const definition = defineBlock<SignalProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
