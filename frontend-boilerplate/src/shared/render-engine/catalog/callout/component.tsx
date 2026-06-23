/**
 * Bloco `callout` (narrativo) — usa o Vitrine `CalloutTremor`. O ícone deriva
 * da variante semântica.
 *
 * ===== COR DA CAIXA × COR DO TEXTO (separadas e independentes) =====
 *  - Sem `boxColor`/`textColor` → o `variant` manda (cores semânticas do DS).
 *  - `boxColor`  → resolvido por `resolveAccent()` e aplicado SÓ na CAIXA
 *    (className `bg-*` OU `style.background`).
 *  - `textColor` → resolvido por `resolveAccent()` e aplicado SÓ no TEXTO. Como
 *    `resolveAccent` devolve cor de FUNDO (`bg-*` / `style.background`),
 *    convertemos para cor de TEXTO (`text-*` / `style.color`) via
 *    `toTextColorParts()`. O ícone usa `currentColor`, então acompanha o texto.
 *  As duas cores são INDEPENDENTES: caixa turquesa + texto branco, por exemplo.
 */
import type { CSSProperties } from 'react';
import { Info, CircleCheck, TriangleAlert, CircleX } from 'lucide-react';
import { CalloutTremor } from '@/components/ui/callout-tremor';
import { resolveAccent } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type CalloutVariant = 'default' | 'info' | 'success' | 'warning' | 'error';
type CalloutProps = {
  variant?: CalloutVariant;
  title?: string;
  description?: string;
  /** Cor da CAIXA (fundo). Sobrescreve o variant. Independente do texto. */
  boxColor?: string;
  /** Cor do TEXTO. Sobrescreve o variant. Independente da caixa. */
  textColor?: string;
  /** Mostra o ícone semântico à esquerda do título. Default: true. */
  showIcon?: boolean;
};

const ICONS: Record<CalloutVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
};

/** Partes de cor para a CAIXA (fundo): classe Tailwind `bg-*` OU `style.background`. */
function toBoxColorParts(
  color: string | undefined,
): { className?: string; style?: CSSProperties } {
  if (color == null || color === '') return {};
  const r = resolveAccent(color);
  return r.kind === 'class' ? { className: r.className } : { style: r.style };
}

/**
 * Partes de cor para o TEXTO: classe Tailwind `text-*` OU `style.color`.
 * `resolveAccent` é orientado a fundo (devolve `bg-*` / `style.background`),
 * então convertemos: `bg-*` → `text-*` e `style.background` → `style.color`.
 */
function toTextColorParts(
  color: string | undefined,
): { className?: string; style?: CSSProperties } {
  if (color == null || color === '') return {};
  const r = resolveAccent(color);
  if (r.kind === 'style') {
    const background = (r.style as { background?: string }).background;
    return background ? { style: { color: background } } : {};
  }
  // class: troca o prefixo de fundo (`bg-`) por cor de texto (`text-`).
  return { className: r.className.replace(/(^|\s)bg-/g, '$1text-') };
}

export const Component: BlockComponent<CalloutProps> = ({ props }) => {
  const variant = props.variant ?? 'success';
  const showIcon = props.showIcon ?? true;

  const box = toBoxColorParts(props.boxColor);
  const text = toTextColorParts(props.textColor);

  return (
    <CalloutTremor
      variant={variant}
      title={props.title ?? 'Observação'}
      icon={showIcon ? ICONS[variant] : undefined}
      boxClassName={box.className}
      boxStyle={box.style}
      textClassName={text.className}
      textStyle={text.style}
    >
      {props.description}
    </CalloutTremor>
  );
};

export const definition = defineBlock<CalloutProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
