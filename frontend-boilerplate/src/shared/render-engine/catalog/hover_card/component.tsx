/**
 * Bloco `hover_card` (layout) — o `HoverCard` do Astryx.
 *
 * O gatilho fica visível (um `Button`) e o cartão aparece no hover/foco. O
 * conteúdo do cartão vai pela prop `content` do DS — quem cuida de
 * posicionamento, atraso e dismiss é o componente, não o bloco.
 */
import { Button } from '@astryxdesign/core/Button';
import { HoverCard } from '@astryxdesign/core/HoverCard';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type HoverCardBlockProps = {
  triggerLabel?: string;
  title?: string;
  content?: string;
};

export const Component: BlockComponent<HoverCardBlockProps> = ({ props }) => {
  return (
    <VStack hAlign="center" paddingBlock={6} data-slot="hover-card">
      <HoverCard
        content={
          <VStack gap={1}>
            <Text weight="semibold">{props.title ?? 'Título'}</Text>
            {props.content ? (
              <Text type="supporting" color="secondary">
                {props.content}
              </Text>
            ) : null}
          </VStack>
        }
      >
        <Button variant="ghost" size="sm" label={props.triggerLabel ?? 'Passe o mouse'} />
      </HoverCard>
    </VStack>
  );
};

export const definition = defineBlock<HoverCardBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
