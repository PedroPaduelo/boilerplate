/**
 * Bloco `flip_words` (título animado, sem dados) — prefixo fixo + palavra que
 * troca em ciclo.
 *
 * O título é `Heading` do DS (nível 3, tipografia do tema); só a troca da
 * palavra é COMPONENTE PRÓPRIO (`./flip-words`), e ela herda o tamanho do
 * `Heading` em vez de fixar o seu.
 */
import { Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { FlipWords } from './flip-words';

type FlipWordsProps = {
  prefix?: string;
  words?: string[];
  duration?: number;
};

const FALLBACK_WORDS = ['claros', 'rápidos', 'acionáveis'];
const DEFAULT_DURATION_MS = 2200;

export const Component: BlockComponent<FlipWordsProps> = ({ props }) => {
  const words = props.words?.length ? props.words : FALLBACK_WORDS;

  return (
    <VStack paddingBlock={4} hAlign="center" data-slot="flip-words-block">
      <Heading level={3} justify="center" textWrap="balance">
        {props.prefix ? `${props.prefix} ` : null}
        <FlipWords words={words} durationMs={props.duration ?? DEFAULT_DURATION_MS} />
      </Heading>
    </VStack>
  );
};

export const definition = defineBlock<FlipWordsProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
