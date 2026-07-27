/**
 * Bloco `kpi` (shape 'scalar') — indicador único sobre o `KpiCard` de
 * `@/shared/ui`.
 *
 * O que mudou na migração:
 *  - a caixa é o `Card` do design system e a variação é o selo de delta da
 *    base (que decide a cor pela LEITURA de negócio, via `deltaPolarity`);
 *  - COR: `accent` continua aceitando o vocabulário antigo, mas agora vira a
 *    VARIANTE de cor do card — a forma suportada de categorizar um indicador.
 *    Sumiram a faixa lateral pintada à mão e o chip de ícone com texto branco;
 *  - o ícone é resolvido do mesmo registry de sempre e entregue já montado no
 *    `Icon` do DS (tamanho e cor por token).
 */
import type { ScalarData } from '@dashboards/contracts';
import { Icon } from '@astryxdesign/core/Icon';
import { KpiCard, chartAccentCardVariant } from '@/shared/ui';
import { formatKpiValue, formatValueByEnum, type ValueFormat } from '@/shared/lib/format';
import { resolveLucideIcon } from '../../lib/lucide-resolver';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

/** 'auto' = display automático pela unidade/magnitude; demais = força o formato. */
type KpiValueFormat = 'auto' | ValueFormat;

type KpiProps = {
  label?: string;
  valueFormat?: KpiValueFormat;
  /** Cor de categorização do card; resolvida para variante do DS. */
  accent?: string;
  icon?: string;
  showDelta?: boolean;
  deltaPolarity?: 'up-good' | 'up-bad';
};

export const Component: BlockComponent<KpiProps, ScalarData> = ({
  props,
  data,
  state,
}) => {
  const value = data?.value ?? 0;
  const valueFormat = props.valueFormat ?? 'auto';
  const displayValue =
    valueFormat === 'auto'
      ? formatKpiValue(value, data?.unit)
      : formatValueByEnum(value, valueFormat);

  // O contrato entrega `delta` como FRAÇÃO (0.12); o card lê em pontos
  // percentuais. Uma casa decimal basta — KPI não é relatório.
  const showDelta = props.showDelta !== false;
  const delta =
    showDelta && data?.delta != null ? Math.round(data.delta * 1000) / 10 : undefined;

  const LucideIcon = resolveLucideIcon(props.icon);

  return (
    <KpiCard
      label={props.label ?? data?.label ?? manifest.name}
      value={value}
      displayValue={displayValue}
      delta={delta}
      higherIsBetter={(props.deltaPolarity ?? 'up-good') !== 'up-bad'}
      icon={
        LucideIcon ? <Icon icon={LucideIcon} size="sm" color="secondary" /> : undefined
      }
      variant={chartAccentCardVariant(props.accent)}
      isLoading={state === 'loading' || state === 'skeleton'}
    />
  );
};

export const definition = defineBlock<KpiProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
