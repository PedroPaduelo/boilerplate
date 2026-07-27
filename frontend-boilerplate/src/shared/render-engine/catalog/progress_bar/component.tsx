/**
 * Bloco `progress_bar` (shape 'scalar') — progresso de um valor sobre uma
 * escala, agora no `ProgressBar` DO ASTRYX (o design system tem esse
 * componente; não havia por que manter um próprio).
 *
 * O que mudou na migração:
 *  - o rótulo e a leitura do valor são do próprio `ProgressBar` — sumiu a linha
 *    de texto montada à mão acima da barra, e com ela o risco de rótulo e barra
 *    discordarem;
 *  - COR: a barra do DS trabalha com VARIANTES SEMÂNTICAS. `variant` mapeia
 *    direto (default → destaque, error → negativo, e assim por diante) e
 *    `accent`, quando vem preenchido, significa "pinte com a cor de destaque" —
 *    é o mais próximo honesto de uma cor arbitrária dentro do sistema;
 *  - a barra do DS já se anuncia como `progressbar` com valor, mínimo e máximo.
 */
import type { ScalarData } from '@dashboards/contracts';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { formatNumberBR, formatPercentBR, toNumber } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

/** Variantes semânticas aceitas pelo `ProgressBar` do DS. */
type ProgressVariant = 'accent' | 'success' | 'warning' | 'error' | 'neutral';

type ProgressBarProps = {
  /** Valor máximo (escala) usado para calcular o %. Default: 100. */
  max?: number;
  /** Cor semântica do preenchimento. Sobrescrita por `accent`. */
  variant?: 'default' | 'neutral' | 'warning' | 'error' | 'success';
  /** Cor de destaque (ver manifest): preenchida, pinta a barra com o acento. */
  accent?: string;
  /** Mostra a leitura do valor ao lado do rótulo. */
  showValue?: boolean;
};

/** Escala default do progresso quando `max` não vem nas props. */
const DEFAULT_MAX = 100;

/** Vocabulário antigo → variante semântica do DS. */
const VARIANT: Record<string, ProgressVariant> = {
  default: 'accent',
  neutral: 'neutral',
  warning: 'warning',
  error: 'error',
  success: 'success',
};

export const Component: BlockComponent<ProgressBarProps, ScalarData> = ({
  props,
  data,
  state,
}) => {
  if (state === 'loading' || state === 'skeleton') {
    return <Skeleton height={40} radius={1} aria-label="Carregando progresso" />;
  }

  const value = toNumber(data?.value);
  if (value == null) {
    return <EmptyState isCompact title="Sem dados para exibir" />;
  }

  const rawMax = props.max ?? DEFAULT_MAX;
  const max = rawMax > 0 ? rawMax : DEFAULT_MAX;
  // `accent` preenchido vence o `variant`, como no comportamento antigo — só
  // que agora a cor custom vira a cor de DESTAQUE do tema.
  const hasAccent = typeof props.accent === 'string' && props.accent.trim() !== '';
  const variant = hasAccent
    ? 'accent'
    : (VARIANT[props.variant ?? 'default'] ?? 'accent');

  return (
    <ProgressBar
      value={value}
      max={max}
      label={data?.label ?? manifest.name}
      variant={variant}
      hasValueLabel={props.showValue ?? true}
      formatValueLabel={(current, total) =>
        total === DEFAULT_MAX
          ? formatPercentBR(current / total)
          : `${formatNumberBR(current)} de ${formatNumberBR(total)}`
      }
    />
  );
};

/**
 * Insight de rodapé. Usa a escala default (100), porque `deriveTakeaway` só
 * recebe os DADOS — é o caso comum de progresso percentual.
 */
function deriveTakeaway(data: ScalarData): string[] | undefined {
  const value = toNumber(data?.value);
  if (value == null) return undefined;

  const fraction = value / DEFAULT_MAX;
  if (fraction >= 1) {
    return [`Meta atingida (${formatNumberBR(value)} de ${formatNumberBR(DEFAULT_MAX)})`];
  }

  return [
    `${formatPercentBR(fraction)} da meta (${formatNumberBR(value)} de ${formatNumberBR(DEFAULT_MAX)})`,
    `Faltam ${formatPercentBR(Math.max(0, 1 - fraction))} para a meta`,
  ];
}

export const definition = defineBlock<ProgressBarProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
