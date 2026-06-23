/**
 * Bloco `bento_grid` (layout/decorativo) — usa o Vitrine `BentoGrid`.
 */
import { LayoutGrid } from 'lucide-react';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BentoItem = { title?: string; description?: string };
type BentoGridProps = { items?: BentoItem[] };

const FALLBACK: BentoItem[] = [
  { title: 'Destaque 1', description: 'Descrição do destaque.' },
  { title: 'Destaque 2', description: 'Descrição do destaque.' },
  { title: 'Destaque 3', description: 'Descrição do destaque.' },
];

export const Component: BlockComponent<BentoGridProps> = ({ props }) => {
  const items = props.items?.length ? props.items : FALLBACK;
  return (
    <BentoGrid className="md:auto-rows-[11rem] md:grid-cols-3">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          icon={<LayoutGrid className="size-4 text-muted-foreground" />}
          header={
            <div className="h-full min-h-24 w-full rounded-lg bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
          }
        />
      ))}
    </BentoGrid>
  );
};

export const definition = defineBlock<BentoGridProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
