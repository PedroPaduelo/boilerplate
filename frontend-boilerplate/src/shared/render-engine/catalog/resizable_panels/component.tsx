/**
 * Bloco `resizable_panels` (layout) — usa o Vitrine `ResizablePanelGroup`.
 */
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ResizableProps = {
  direction?: 'horizontal' | 'vertical';
  leftLabel?: string;
  rightLabel?: string;
};

export const Component: BlockComponent<ResizableProps> = ({ props }) => {
  return (
    <div className="h-56 w-full overflow-hidden rounded-lg border border-border">
      <ResizablePanelGroup direction={props.direction ?? 'horizontal'}>
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-4 text-sm font-medium text-foreground">
            {props.leftLabel ?? 'Painel A'}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-4 text-sm font-medium text-foreground">
            {props.rightLabel ?? 'Painel B'}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export const definition = defineBlock<ResizableProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
