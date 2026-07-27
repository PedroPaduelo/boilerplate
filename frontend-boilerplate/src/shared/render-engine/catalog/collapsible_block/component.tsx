/**
 * Bloco `collapsible_block` — CONTAINER de layout colapsável: o `Collapsible`
 * do Astryx dentro de um `Card` (a separação visual recomendada pelo DS para
 * uma seção colapsável solta).
 *
 * O `BlockRenderer` injeta o sub-grid de filhos (já renderizados) via
 * `children`; este componente só desenha o shell (cartão + gatilho) e coloca
 * `children` no corpo.
 *
 * ESPAÇAMENTO: o `Collapsible` já traz o respiro do gatilho e do corpo pela
 * densidade do design system — sumiram os `px-2 pb-3 pt-2` que o componente
 * legado exigia. O `gap` entre filhos continua vindo do `BlockGrid`.
 *
 * Sem filhos (galeria do catálogo), mostra o placeholder ilustrativo.
 */
import { Card } from '@astryxdesign/core/Card';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { Text } from '@astryxdesign/core/Text';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { CollapsiblePlaceholder } from './collapsible-placeholder';

type CollapsibleBlockProps = { title?: string; defaultOpen?: boolean };

export const Component: BlockComponent<CollapsibleBlockProps> = ({ props, children }) => {
  return (
    <Card padding={0} data-slot="collapsible-block">
      <Collapsible
        trigger={<Text weight="semibold">{props.title ?? 'Seção'}</Text>}
        defaultIsOpen={props.defaultOpen ?? true}
      >
        {children ?? <CollapsiblePlaceholder />}
      </Collapsible>
    </Card>
  );
};

export const definition = defineBlock<CollapsibleBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
