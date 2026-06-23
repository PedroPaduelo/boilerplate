/**
 * Bloco `tooltip_fluid` (layout) — usa o Vitrine `TooltipFluid`. O gatilho
 * (`Button`) fica visível; o tooltip aparece no hover/focus.
 */
import { Button } from '@/components/ui/button';
import { TooltipFluid } from '@/components/ui/tooltip-fluid';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type TooltipFluidBlockProps = {
  triggerLabel?: string;
  content?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

export const Component: BlockComponent<TooltipFluidBlockProps> = ({ props }) => {
  return (
    <div className="flex items-center justify-center py-10">
      <TooltipFluid content={props.content ?? 'Dica'} side={props.side ?? 'top'}>
        <Button variant="outline">{props.triggerLabel ?? 'Passe o mouse'}</Button>
      </TooltipFluid>
    </div>
  );
};

export const definition = defineBlock<TooltipFluidBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
