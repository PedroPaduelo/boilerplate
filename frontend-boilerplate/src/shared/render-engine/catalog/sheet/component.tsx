/**
 * Bloco `sheet` (layout) — usa o Vitrine `Sheet`. O gatilho é um `Button`
 * (o overlay não abre sozinho na galeria).
 */
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SheetBlockProps = {
  triggerLabel?: string;
  title?: string;
  description?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

export const Component: BlockComponent<SheetBlockProps> = ({ props }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">{props.triggerLabel ?? 'Abrir painel'}</Button>
        </SheetTrigger>
        <SheetContent side={props.side ?? 'right'}>
          <SheetHeader>
            <SheetTitle>{props.title ?? 'Painel'}</SheetTitle>
            {props.description ? <SheetDescription>{props.description}</SheetDescription> : null}
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const definition = defineBlock<SheetBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
