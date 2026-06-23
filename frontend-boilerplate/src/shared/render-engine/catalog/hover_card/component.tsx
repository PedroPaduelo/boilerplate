/**
 * Bloco `hover_card` (layout) — usa o Vitrine `HoverCard`. O gatilho fica
 * visível (o conteúdo aparece no hover).
 */
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type HoverCardBlockProps = { triggerLabel?: string; title?: string; content?: string };

export const Component: BlockComponent<HoverCardBlockProps> = ({ props }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="link">{props.triggerLabel ?? 'Passe o mouse'}</Button>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">{props.title ?? 'Título'}</h4>
            {props.content ? (
              <p className="text-sm text-muted-foreground">{props.content}</p>
            ) : null}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

export const definition = defineBlock<HoverCardBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
