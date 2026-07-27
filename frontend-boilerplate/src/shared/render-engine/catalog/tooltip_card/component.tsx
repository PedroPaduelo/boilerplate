/**
 * Bloco `tooltip_card` (layout) — o `Tooltip` do Astryx.
 *
 * O gatilho fica visível (um `Button`) e a dica aparece no hover/foco — com
 * teclado incluso, que o tooltip "que segue o cursor" do legado não cobria.
 */
import { Button } from '@astryxdesign/core/Button';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type TooltipCardBlockProps = { triggerLabel?: string; content?: string };

export const Component: BlockComponent<TooltipCardBlockProps> = ({ props }) => {
  return (
    <VStack hAlign="center" paddingBlock={6} data-slot="tooltip-card">
      <Tooltip content={props.content ?? 'Conteúdo do tooltip'}>
        <Button
          variant="secondary"
          size="sm"
          label={props.triggerLabel ?? 'Passe o mouse'}
        />
      </Tooltip>
    </VStack>
  );
};

export const definition = defineBlock<TooltipCardBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
