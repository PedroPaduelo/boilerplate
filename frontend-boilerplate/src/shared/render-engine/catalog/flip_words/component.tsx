/**
 * Bloco `flip_words` (título animado) — usa o Vitrine `FlipWords`.
 */
import { FlipWords } from '@/components/ui/flip-words';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type FlipWordsProps = {
  prefix?: string;
  words?: string[];
  duration?: number;
};

export const Component: BlockComponent<FlipWordsProps> = ({ props }) => {
  const words = props.words?.length ? props.words : ['claros', 'rápidos', 'acionáveis'];
  return (
    <div className="flex min-h-24 items-center justify-center py-4 text-center text-2xl font-semibold text-foreground">
      <span>
        {props.prefix ? <span>{props.prefix} </span> : null}
        <FlipWords words={words} duration={props.duration ?? 2200} className="font-bold text-primary" />
      </span>
    </div>
  );
};

export const definition = defineBlock<FlipWordsProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
