/**
 * Bloco `mobius_loop` (decorativo) — usa o Vitrine `MobiusLoopIcon`.
 */
import { MobiusLoopIcon } from '@/components/ui/mobius-loop-icon';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type MobiusProps = {
  size?: number;
  speed?: 'slow' | 'normal' | 'fast';
};

export const Component: BlockComponent<MobiusProps> = ({ props }) => {
  return (
    <div className="flex items-center justify-center py-8 text-primary">
      <MobiusLoopIcon size={props.size ?? 64} speed={props.speed ?? 'normal'} />
    </div>
  );
};

export const definition = defineBlock<MobiusProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
