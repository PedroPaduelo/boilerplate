/**
 * Bloco `collapsible_block` — REGIÃO que recolhe: o `Collapsible` do Astryx
 * dentro da superfície escolhida.
 *
 * O `BlockContainer` injeta o grid de filhos (montado com as props deste
 * bloco) via `children`; aqui só se desenha o gatilho e a caixa.
 *
 * O que mudou nesta repaginação:
 *
 *  - o `Card` deixou de ser obrigatório. O bloco vinha sempre embrulhado num
 *    cartão, o que somava moldura à moldura dos gráficos de dentro; a
 *    superfície agora é `plain` por padrão e vira card só se pedirem;
 *  - o título perdeu o default de fábrica (`'Detalhes da apuração'`), que o
 *    `BlockRenderer` mesclava em toda renderização e aparecia no gatilho de
 *    qualquer bloco sem título, como se fosse escolha do autor.
 *
 * ESPAÇAMENTO: o `Collapsible` já traz o respiro do gatilho e do corpo pela
 * densidade do design system. O `gap` entre filhos continua vindo do
 * `BlockGrid`.
 *
 * Sem filhos (galeria do catálogo), mostra o placeholder ilustrativo.
 */
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { Text } from '@astryxdesign/core/Text';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { BlockSurface } from '../../block-surface';
import { resolveSurfaceVariant } from '../../lib/layout-options';
import type {
  BlockGridAlign,
  BlockGridGap,
  BlockItemSizing,
  BlockSurfaceVariant,
} from '../../lib/layout-options';
import type { BlockRowHeight } from '../../lib/block-sizing';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { CollapsiblePlaceholder } from './collapsible-placeholder';

type CollapsibleBlockProps = {
  title?: string;
  defaultOpen?: boolean;
  columns?: number;
  gap?: BlockGridGap;
  align?: BlockGridAlign;
  rowHeight?: BlockRowHeight;
  itemSizing?: BlockItemSizing;
  variant?: BlockSurfaceVariant;
};

/**
 * Rótulo do gatilho quando o autor não informou `title`.
 *
 * NÃO é um `defaultProps`: um disclosure sem nome acessível é um botão mudo
 * para quem usa leitor de tela, então o recuo precisa existir — mas ele mora
 * aqui, no render, e não no manifesto, para que "sem título" continue sendo
 * distinguível de "título escolhido".
 */
const FALLBACK_TRIGGER = 'Detalhes';

export const Component: BlockComponent<CollapsibleBlockProps> = ({ props, children }) => {
  const variant = resolveSurfaceVariant(props.variant);
  const title =
    typeof props.title === 'string' && props.title.trim().length > 0
      ? props.title
      : FALLBACK_TRIGGER;

  return (
    <BlockSurface variant={variant} slot="collapsible-block">
      <Collapsible
        trigger={<Text weight="semibold">{title}</Text>}
        defaultIsOpen={props.defaultOpen ?? true}
      >
        {children ?? <CollapsiblePlaceholder />}
      </Collapsible>
    </BlockSurface>
  );
};

export const definition = defineBlock<CollapsibleBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
