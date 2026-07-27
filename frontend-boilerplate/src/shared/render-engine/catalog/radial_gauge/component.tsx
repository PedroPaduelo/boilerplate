/**
 * Bloco `radial_gauge` (shape 'scalar') — medidor radial sobre o `RadialGauge`
 * de `@/shared/ui`.
 *
 * O que mudou na migração:
 *  - o arco vem pronto da base, anunciado como `meter` com valor, mínimo e
 *    máximo — antes era um desenho mudo com `role="img"`;
 *  - COR: `accent` continua aceitando o vocabulário antigo, mas vira token de
 *    dado do DS; sumiram o `var(--primary)` do tema legado e o brilho colorido
 *    aplicado por trás do arco;
 *  - a unidade (`%`, `km`, `pts`) segue vindo das props ou do dado e entra na
 *    formatação da leitura central.
 */
import type { ScalarData } from '@dashboards/contracts';
import { RadialGauge, chartAccentColor } from '@/shared/ui';
import { formatNumberBR, formatPercentPointsBR, toNumber } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type GaugeProps = {
  max?: number;
  min?: number;
  unit?: string;
  /** Cor do arco; resolvida para token de dado do DS. */
  accent?: string;
};

/** Diâmetro e espessura do medidor em px — geometria do desenho. */
const GAUGE_SIZE = 160;
const GAUGE_THICKNESS = 14;

/** Formata a leitura central conforme a unidade do dado. */
function readingFormatter(unit: string | undefined) {
  return (value: number): string => {
    if (unit === '%') return formatPercentPointsBR(value);
    return unit ? `${formatNumberBR(value)} ${unit}` : formatNumberBR(value);
  };
}

export const Component: BlockComponent<GaugeProps, ScalarData> = ({
  props,
  data,
  state,
  error,
}) => {
  const value = toNumber(data?.value) ?? 0;
  const unit = props.unit ?? data?.unit;

  return (
    <RadialGauge
      value={value}
      min={props.min ?? 0}
      max={props.max ?? 100}
      size={GAUGE_SIZE}
      thickness={GAUGE_THICKNESS}
      color={chartAccentColor(props.accent)}
      label={data?.label ?? manifest.name}
      caption={data?.label}
      valueFormatter={readingFormatter(unit)}
      isLoading={state === 'loading' || state === 'skeleton'}
      emptyMessage={
        state === 'error' ? (error ?? 'Erro ao carregar os dados') : undefined
      }
    />
  );
};

/** Insight de rodapé: a leitura do medidor, com rótulo e unidade do dado. */
function deriveTakeaway(data: ScalarData): string[] | undefined {
  const value = toNumber(data?.value);
  if (value == null) return undefined;

  const label = data?.label?.trim();
  const reading = readingFormatter(data?.unit?.trim())(value);
  return [label ? `${label}: ${reading}` : reading];
}

export const definition = defineBlock<GaugeProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
