/**
 * Bloco `card_hover` (layout) — usa o Vitrine `HoverEffect`.
 */
import { HoverEffect } from '@/components/ui/card-hover-effect';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type HoverItem = { title?: string; description?: string; link?: string };
type CardHoverProps = { items?: HoverItem[] };

const FALLBACK: HoverItem[] = [
  { title: 'Destaque 1', description: 'Descrição do destaque.' },
  { title: 'Destaque 2', description: 'Descrição do destaque.' },
  { title: 'Destaque 3', description: 'Descrição do destaque.' },
];

export const Component: BlockComponent<CardHoverProps> = ({ props }) => {
  const source = props.items?.length ? props.items : FALLBACK;
  const items = source.map((it, i) => ({
    title: it.title ?? '',
    description: it.description ?? '',
    link: it.link || `#${i}`,
  }));
  return <HoverEffect items={items} className="py-4" />;
};

export const definition = defineBlock<CardHoverProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
