/**
 * Bloco `collapsible_block` (layout) — usa o Vitrine `CollapsibleSection`.
 */
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type CollapsibleBlockProps = { title?: string; body?: string; defaultOpen?: boolean };

export const Component: BlockComponent<CollapsibleBlockProps> = ({ props }) => {
  return (
    <div className="rounded-lg border border-border">
      <CollapsibleSection title={props.title ?? 'Seção'} defaultOpen={props.defaultOpen ?? true}>
        <p className="px-1 py-2 text-sm text-muted-foreground">{props.body ?? ''}</p>
      </CollapsibleSection>
    </div>
  );
};

export const definition = defineBlock<CollapsibleBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
