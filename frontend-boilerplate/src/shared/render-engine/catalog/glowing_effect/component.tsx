/**
 * Bloco `glowing_effect` (layout) — card em destaque com um anel que acende e
 * gira conforme o ponteiro se aproxima.
 *
 * O card é `Card` do DS e o texto é `Heading`/`Text`; só o anel é COMPONENTE
 * PRÓPRIO (`./glowing-effect`) e ele é decorativo (`aria-hidden`).
 */
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Text, Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { GlowingEffect, type GlowingEffectVariant } from './glowing-effect';

type GlowingEffectBlockProps = {
  title?: string;
  description?: string;
  variant?: GlowingEffectVariant;
};

/** Altura do card de demonstração — 7 passos de `--spacing-8`. */
const CARD_MIN_BLOCK_SIZE = 'calc(var(--spacing-8) * 7)';

export const Component: BlockComponent<GlowingEffectBlockProps> = ({ props }) => {
  return (
    <GlowingEffect variant={props.variant ?? 'default'}>
      <Card padding={6} minHeight={CARD_MIN_BLOCK_SIZE} data-slot="glowing-effect-block">
        <Center height="100%" width="100%">
          <VStack gap={2} hAlign="center">
            <Heading level={4} justify="center" textWrap="balance">
              {props.title ?? 'Destaque'}
            </Heading>
            {props.description ? (
              <Text type="supporting" justify="center" textWrap="balance">
                {props.description}
              </Text>
            ) : null}
          </VStack>
        </Center>
      </Card>
    </GlowingEffect>
  );
};

export const definition = defineBlock<GlowingEffectBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
