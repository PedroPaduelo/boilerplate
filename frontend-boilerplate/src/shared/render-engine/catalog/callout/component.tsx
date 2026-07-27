/**
 * Bloco `callout` (narrativo) — banner de destaque semântico: o `Banner` do
 * Astryx (mesmo componente do `alert`; o que muda é a intenção editorial).
 *
 * ===== TOM DA CAIXA × TOM DO TEXTO (separados e independentes) =====
 *  - Sem `boxColor`/`textColor` → o `variant` manda (status semântico do DS).
 *  - `boxColor`  → resolvido por `resolveBoxTone()` para o `status` do Banner
 *    (cor da caixa + ícone) — sobrescreve o `variant`.
 *  - `textColor` → resolvido por `resolveTextTone()` para o `color` do `Text`
 *    (título + corpo) — independente da caixa.
 *
 * Nenhuma cor crua chega ao DOM: valores legados (hex/gradiente/classe
 * Tailwind) são traduzidos para tokens ou ignorados (ver `tone.ts`).
 */
import { Banner } from '@astryxdesign/core/Banner';
import type { BannerStatus } from '@astryxdesign/core/Banner';
import { Text } from '@astryxdesign/core/Text';
import type { TextColor } from '@astryxdesign/core/Text';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { resolveBoxTone, resolveTextTone } from './tone';

type CalloutVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

type CalloutProps = {
  variant?: CalloutVariant;
  title?: string;
  description?: string;
  /** Tom da CAIXA. Sobrescreve o variant. Independente do texto. */
  boxColor?: string;
  /** Tom do TEXTO. Sobrescreve o variant. Independente da caixa. */
  textColor?: string;
  /** Mostra o ícone semântico à esquerda do título. Default: true. */
  showIcon?: boolean;
};

/** Preset semântico do bloco → `status` do Banner. */
const STATUS_BY_VARIANT: Record<CalloutVariant, BannerStatus> = {
  default: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

/** Aplica o tom de texto só quando ele foi pedido — senão, herda do Banner. */
function toned(content: string, tone: TextColor | undefined, isTitle: boolean) {
  if (tone == null) return content;
  return (
    <Text color={tone} weight={isTitle ? 'semibold' : 'normal'}>
      {content}
    </Text>
  );
}

export const Component: BlockComponent<CalloutProps> = ({ props }) => {
  const variant: CalloutVariant = props.variant ?? 'success';
  const showIcon = props.showIcon ?? true;
  const status = resolveBoxTone(props.boxColor) ?? STATUS_BY_VARIANT[variant] ?? 'info';
  const textTone = resolveTextTone(props.textColor);
  const title = props.title ?? 'Observação';

  return (
    <Banner
      data-slot="callout"
      data-callout-variant={variant}
      status={status}
      title={toned(title, textTone, true)}
      description={
        props.description ? toned(props.description, textTone, false) : undefined
      }
      icon={showIcon ? undefined : false}
    />
  );
};

export const definition = defineBlock<CalloutProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
