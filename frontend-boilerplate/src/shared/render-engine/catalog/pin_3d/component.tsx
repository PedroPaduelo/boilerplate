/**
 * Bloco `pin_3d` (layout/decorativo) — card apresentado num palco 3D, com
 * etiqueta ("pin") e halo que acendem no hover ou no foco de teclado.
 *
 * O card, a etiqueta e o texto são do DS (`ClickableCard`, `Badge`,
 * `Heading`/`Text`); só o palco é COMPONENTE PRÓPRIO (`./pin-3d`). A faixa
 * colorida do card é decorativa (`aria-hidden`) e pinta com a rampa
 * sequencial de data-viz do tema — antes era um gradiente violeta cravado.
 */
import { Center } from '@astryxdesign/core/Center';
import { Text, Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { Pin3D, PIN_STAGE_BLOCK_SIZE } from './pin-3d';

type Pin3DBlockProps = {
  pinLabel?: string;
  href?: string;
  title?: string;
  description?: string;
};

/**
 * Faixa decorativa do card — 3 passos de `--spacing-8` de altura e rampa
 * SEQUENCIAL de data-viz, em utility com token (regra 2.3: pintura não vai em
 * `style`).
 */
const ARTWORK_CLASS = [
  'block h-[calc(var(--spacing-8)_*_3)] rounded-[var(--radius-inner)]',
  'bg-[image:linear-gradient(135deg,var(--color-data-purple-2),var(--color-data-purple-4),var(--color-data-blue-4))]',
].join(' ');

export const Component: BlockComponent<Pin3DBlockProps> = ({ props }) => {
  const title = props.title ?? 'Título';

  return (
    <Center width="100%" height={PIN_STAGE_BLOCK_SIZE} data-slot="pin-3d-block">
      <Pin3D label={props.pinLabel ?? 'Link'} href={props.href ?? '#'} cardLabel={title}>
        <VStack gap={2}>
          <Heading level={4} maxLines={2}>
            {title}
          </Heading>
          {props.description ? (
            <Text type="supporting" maxLines={3}>
              {props.description}
            </Text>
          ) : null}
          <span aria-hidden="true" className={ARTWORK_CLASS} />
        </VStack>
      </Pin3D>
    </Center>
  );
};

export const definition = defineBlock<Pin3DBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
