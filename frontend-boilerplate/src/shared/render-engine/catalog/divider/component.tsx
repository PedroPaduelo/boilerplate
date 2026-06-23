/**
 * Bloco `divider` (layout) — usa o Vitrine `DividerTremor`.
 */
import { DividerTremor } from '@/components/ui/divider-tremor';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DividerProps = { label?: string; orientation?: 'horizontal' | 'vertical' };

export const Component: BlockComponent<DividerProps> = ({ props }) => {
  if (props.orientation === 'vertical') {
    return (
      <div className="flex h-24 items-center justify-center gap-4 px-6">
        <span className="text-sm text-muted-foreground">Antes</span>
        <DividerTremor orientation="vertical" />
        <span className="text-sm text-muted-foreground">Depois</span>
      </div>
    );
  }
  return (
    <div className="px-2 py-6">
      <DividerTremor>{props.label ? props.label : undefined}</DividerTremor>
    </div>
  );
};

export const definition = defineBlock<DividerProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
