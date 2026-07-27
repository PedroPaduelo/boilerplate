/**
 * Bloco `mobius_loop` (layout/decorativo) — ilustração animada centrada.
 *
 * O enquadramento é do DS (`VStack` + `Center`, respiro pela escala de
 * espaçamento); só a fita é COMPONENTE PRÓPRIO (`./mobius-loop-icon`).
 */
import { Center } from '@astryxdesign/core/Center';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { MobiusLoopIcon, type MobiusLoopSpeed } from './mobius-loop-icon';

type MobiusProps = {
  size?: number;
  speed?: MobiusLoopSpeed;
};

const DEFAULT_SIZE = 64;

export const Component: BlockComponent<MobiusProps> = ({ props }) => {
  return (
    <VStack paddingBlock={8} data-slot="mobius-loop-block">
      <Center width="100%">
        <MobiusLoopIcon
          size={props.size ?? DEFAULT_SIZE}
          speed={props.speed ?? 'normal'}
        />
      </Center>
    </VStack>
  );
};

export const definition = defineBlock<MobiusProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
