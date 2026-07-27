/**
 * Bloco `background_boxes` (layout/decorativo) — capa com malha isométrica.
 *
 * O efeito (`./background-boxes`) é só a CASCA: `aria-hidden`, atrás, sem
 * conteúdo dentro. Título e subtítulo vêm do DS (`Heading`/`Text`), então o
 * contraste e o dark mode saem dos tokens do tema — não de um fundo escuro
 * cravado, como no efeito legado.
 */
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Text, Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { BackgroundBoxes } from './background-boxes';

type BackgroundBoxesBlockProps = { title?: string; subtitle?: string };

export const Component: BlockComponent<BackgroundBoxesBlockProps> = ({ props }) => {
  return (
    <Card padding={0} variant="muted" data-slot="background-boxes-block">
      <BackgroundBoxes>
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
      </BackgroundBoxes>
    </Card>
  );
};

export const definition = defineBlock<BackgroundBoxesBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
