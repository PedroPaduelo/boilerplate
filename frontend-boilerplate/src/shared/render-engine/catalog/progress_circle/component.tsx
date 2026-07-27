/**
 * Bloco `progress_circle` (shape 'scalar') — progresso em anel, sobre o
 * `ProgressCircle` de `@/shared/ui` e o `Tooltip` do Astryx.
 *
 * O que mudou na migração:
 *  - o anel vem pronto da base, com papel `progressbar` e valor de verdade
 *    (antes o `role="img"` do wrapper era a única leitura);
 *  - COR: `variant` vira TOM semântico do anel (destaque, positivo, atenção,
 *    negativo, neutro) e `accent`, quando preenchido, significa "use o tom de
 *    destaque" — o anel do DS é pintado por tom, não por cor arbitrária;
 *  - o tooltip é o do design system: ele já cuida de foco, teclado e
 *    posicionamento, então o bloco não precisa de `tabIndex` nem de anel de
 *    foco próprio.
 */
import type { ScalarData } from '@dashboards/contracts';
import { Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import { ProgressCircle } from '@/shared/ui';
import type { ProgressCircleTone } from '@/shared/ui';
import { formatNumberBR, formatPercentBR, toNumber } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ProgressCircleProps = {
  max?: number;
  variant?: 'default' | 'neutral' | 'warning' | 'error' | 'success';
  /** Cor do arco (ver manifest): preenchida, usa o tom de destaque. */
  accent?: string;
};

/** Vocabulário antigo → tom semântico do anel. */
const TONE: Record<string, ProgressCircleTone> = {
  default: 'accent',
  neutral: 'neutral',
  warning: 'warning',
  error: 'negative',
  success: 'positive',
};

/** Diâmetro e espessura do anel em px — geometria do desenho. */
const RING_SIZE = 116;
const RING_THICKNESS = 10;

export const Component: BlockComponent<ProgressCircleProps, ScalarData> = ({
  props,
  data,
  state,
  error,
}) => {
  const value = toNumber(data?.value) ?? 0;
  const rawMax = props.max ?? 100;
  const max = rawMax > 0 ? rawMax : 100;
  const fraction = Math.min(1, Math.max(0, value / max));

  // Com a escala default o valor JÁ é um percentual; com escala própria, a
  // leitura precisa dizer de quanto — senão "73%" de 1.000 fica sem referência.
  const percentLabel = formatPercentBR(fraction);
  const reading =
    max === 100
      ? percentLabel
      : `${percentLabel} (${formatNumberBR(value)} de ${formatNumberBR(max)})`;

  const hasAccent = typeof props.accent === 'string' && props.accent.trim() !== '';
  const tone = hasAccent ? 'accent' : (TONE[props.variant ?? 'default'] ?? 'accent');
  const label = data?.label ?? manifest.name;

  return (
    <VStack gap={2} vAlign="center" hAlign="center" width="100%">
      <Tooltip content={data?.label ? `${data.label}: ${reading}` : reading}>
        <VStack>
          <ProgressCircle
            value={value}
            max={max}
            size={RING_SIZE}
            thickness={RING_THICKNESS}
            tone={tone}
            label={label}
            centerValue={percentLabel}
            summary={reading}
            isLoading={state === 'loading' || state === 'skeleton'}
            emptyMessage={
              state === 'error' ? (error ?? 'Erro ao carregar os dados') : undefined
            }
          />
        </VStack>
      </Tooltip>
      {data?.label ? (
        <Text type="supporting" color="secondary">
          {data.label}
        </Text>
      ) : null}
    </VStack>
  );
};

/**
 * Insight de rodapé: percentual concluído. Usa a escala default (100), porque
 * `deriveTakeaway` só recebe os DADOS.
 */
function deriveTakeaway(data: ScalarData): string[] | undefined {
  const value = toNumber(data?.value);
  if (value == null) return undefined;
  return [`${formatPercentBR(Math.min(1, Math.max(0, value / 100)))} concluído`];
}

export const definition = defineBlock<ProgressCircleProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
