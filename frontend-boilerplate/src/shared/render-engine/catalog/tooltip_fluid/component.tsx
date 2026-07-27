/**
 * Bloco `tooltip_fluid` (layout) — o `Tooltip` do Astryx.
 *
 * A animação "fluida" deixa de ser código do bloco: o movimento de entrada e
 * saída é do design system. O bloco só traduz o `side` do manifesto para o
 * `placement` LÓGICO do DS (start/end acompanham a direção do texto — em RTL
 * espelham sozinhos).
 */
import { Button } from '@astryxdesign/core/Button';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import type { TooltipProps } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
type TooltipFluidBlockProps = {
  triggerLabel?: string;
  content?: string;
  side?: TooltipSide;
};

type Placement = NonNullable<TooltipProps['placement']>;

/** Lado físico do manifesto → posicionamento lógico do DS. */
const PLACEMENT_BY_SIDE: Record<TooltipSide, Placement> = {
  top: 'above',
  bottom: 'below',
  left: 'start',
  right: 'end',
};

export const Component: BlockComponent<TooltipFluidBlockProps> = ({ props }) => {
  const side: TooltipSide = props.side ?? 'top';

  return (
    <VStack hAlign="center" paddingBlock={6} data-slot="tooltip-fluid">
      <Tooltip
        content={props.content ?? 'Dica'}
        placement={PLACEMENT_BY_SIDE[side] ?? 'above'}
      >
        <Button
          variant="secondary"
          size="sm"
          label={props.triggerLabel ?? 'Passe o mouse'}
        />
      </Tooltip>
    </VStack>
  );
};

export const definition = defineBlock<TooltipFluidBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
