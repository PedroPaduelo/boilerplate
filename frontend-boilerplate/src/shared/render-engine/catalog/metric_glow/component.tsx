/**
 * Bloco `metric_glow` (shape 'scalar') — métrica única em destaque. Desenha o
 * próprio cartão (`metric-glow-card.tsx`), por isso não recebe a moldura de
 * gráfico.
 *
 * O que mudou na migração:
 *  - o cartão foi reescrito sobre o design system: sumiram o halo com cor por
 *    classe e o verde/vermelho cravados da variação (agora é o selo da base,
 *    que colore pela leitura de negócio);
 *  - COR: `accent` continua aceitando o vocabulário antigo e vira token de dado
 *    do DS — é a cor do halo;
 *  - o valor continua formatado por `valueFormat` (o `toLocaleString` cru, que
 *    deixava bilhões ilegíveis, ficou para trás).
 */
import type { ScalarData } from '@dashboards/contracts';
import { chartAccentColor } from '@/shared/ui';
import { formatValueByEnum, type ValueFormat } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { MetricGlowCard } from './metric-glow-card';
import { manifest } from './manifest';
import { fixture } from './fixture';

type MetricGlowProps = {
  /** Sobrescreve o título do card. Vazio → `data.label` → nome do bloco. */
  label?: string;
  /** Formato PT-BR do valor em destaque (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
  /** Cor do halo; resolvida para token de dado do DS. */
  accent?: string;
  /** Mostra a variação percentual. */
  showDelta?: boolean;
  /** Semântica de cor da variação. */
  deltaPolarity?: 'up-good' | 'up-bad';
};

export const Component: BlockComponent<MetricGlowProps, ScalarData> = ({
  props,
  data,
  state,
}) => {
  const value = data?.value ?? 0;

  // O contrato entrega `delta` como FRAÇÃO (0.125); o selo lê em pontos
  // percentuais.
  const showDelta = props.showDelta ?? true;
  const delta =
    showDelta && data?.delta != null ? Math.round(data.delta * 1000) / 10 : undefined;

  return (
    <MetricGlowCard
      title={props.label?.trim() || data?.label || manifest.name}
      value={formatValueByEnum(value, props.valueFormat ?? 'compactBRL')}
      delta={delta}
      higherIsBetter={(props.deltaPolarity ?? 'up-good') === 'up-good'}
      color={chartAccentColor(props.accent)}
      isLoading={state === 'loading' || state === 'skeleton'}
    />
  );
};

export const definition = defineBlock<MetricGlowProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
