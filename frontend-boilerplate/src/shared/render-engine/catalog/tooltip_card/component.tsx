/**
 * Bloco `tooltip_card` (layout) — usa o Vitrine `TooltipCard`. O gatilho fica
 * visível; o card aparece no hover e segue o cursor.
 */
import { Button } from '@/components/ui/button';
import { TooltipCard } from '@/components/ui/tooltip-card';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type TooltipCardBlockProps = { triggerLabel?: string; content?: string };

export const Component: BlockComponent<TooltipCardBlockProps> = ({ props }) => {
  return (
    <div className="flex items-center justify-center py-10">
      <TooltipCard content={props.content ?? 'Conteúdo do tooltip'}>
        <Button variant="outline">{props.triggerLabel ?? 'Passe o mouse'}</Button>
      </TooltipCard>
    </div>
  );
};

export const definition = defineBlock<TooltipCardBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
