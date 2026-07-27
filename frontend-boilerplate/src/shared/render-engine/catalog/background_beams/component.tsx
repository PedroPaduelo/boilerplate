/**
 * Bloco `background_beams` (layout/decorativo) — capa/hero de relatório.
 *
 * O efeito (`./background-beams`) é só a CASCA: fica `aria-hidden` atrás e não
 * guarda conteúdo. Título e subtítulo vêm do DS (`Heading`/`Text`), então o
 * contraste, a tipografia e o dark mode saem dos tokens do tema.
 */
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Text, Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { BackgroundBeams } from './background-beams';

type BackgroundBeamsBlockProps = { title?: string; subtitle?: string };

export const Component: BlockComponent<BackgroundBeamsBlockProps> = ({ props }) => {
  return (
    <Card padding={0} variant="muted" data-slot="background-beams-block">
      <BackgroundBeams>
        <Center height="100%" width="100%">
          <VStack gap={2} padding={6} hAlign="center">
            <Heading level={3} justify="center" textWrap="balance">
              {props.title ?? 'Título'}
            </Heading>
            {props.subtitle ? (
              <Text type="supporting" justify="center" textWrap="balance">
                {props.subtitle}
              </Text>
            ) : null}
          </VStack>
        </Center>
      </BackgroundBeams>
    </Card>
  );
};

export const definition = defineBlock<BackgroundBeamsBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
