/**
 * Bloco `stat_tile` (shape 'scalar') — irmão denso do KPI, sobre o `StatTile`
 * de `@/shared/ui`. Mesma ordem de leitura, tipografia um degrau abaixo: é o
 * dado de APOIO, que aparece em fileiras.
 *
 * O que mudou na migração:
 *  - a caixa é o `Card` do design system e a variação usa o selo de delta da
 *    base (cor pela leitura de negócio, via `deltaPolarity`);
 *  - COR: `accent` continua aceitando o vocabulário antigo, mas vira a VARIANTE
 *    de cor do card — sumiu a barra lateral pintada por classe.
 */
import type { ScalarData } from '@dashboards/contracts';
import { StatTile, chartAccentCardVariant } from '@/shared/ui';
import { formatValueByEnum, type ValueFormat } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type StatTileProps = {
  /** Sobrescreve o rótulo derivado de `data.label`. */
  label?: string;
  /** Formato PT-BR do valor (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
  /** Cor de categorização do ladrilho; resolvida para variante do DS. */
  accent?: string;
  /** Mostra a variação (delta). Default `true`. */
  showDelta?: boolean;
  /** Polaridade do delta: `up-good` (subir é bom) | `up-bad`. */
  deltaPolarity?: 'up-good' | 'up-bad';
  /** Texto auxiliar exibido ao lado do delta. */
  hint?: string;
};

export const Component: BlockComponent<StatTileProps, ScalarData> = ({
  props,
  data,
  state,
}) => {
  const value = data?.value ?? 0;

  // O contrato entrega `delta` como FRAÇÃO (0.06); o ladrilho lê em pontos
  // percentuais.
  const showDelta = props.showDelta ?? true;
  const delta =
    showDelta && data?.delta != null ? Math.round(data.delta * 1000) / 10 : undefined;

  return (
    <StatTile
      label={props.label ?? data?.label ?? manifest.name}
      value={value}
      displayValue={formatValueByEnum(value, props.valueFormat ?? 'compactNumber')}
      delta={delta}
      higherIsBetter={(props.deltaPolarity ?? 'up-good') === 'up-good'}
      hint={props.hint}
      variant={chartAccentCardVariant(props.accent)}
      isLoading={state === 'loading' || state === 'skeleton'}
    />
  );
};

export const definition = defineBlock<StatTileProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
