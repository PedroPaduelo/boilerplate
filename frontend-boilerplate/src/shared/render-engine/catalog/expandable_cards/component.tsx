/**
 * Bloco `expandable_cards` (layout) — usa o Vitrine `ExpandableCards`.
 */
import { ExpandableCards } from '@/components/ui/expandable-cards';
import type { ExpandableCard } from '@/components/ui/expandable-cards-types';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ExpandableCardInput = {
  title?: string;
  description?: string;
  src?: string;
  ctaText?: string;
  ctaLink?: string;
  content?: string;
};
type ExpandableCardsBlockProps = { cards?: ExpandableCardInput[] };

const FALLBACK: ExpandableCardInput[] = [
  {
    title: 'Card 1',
    description: 'Descrição',
    src: 'https://picsum.photos/seed/card1/200/200',
    content: 'Conteúdo detalhado do card.',
  },
];

export const Component: BlockComponent<ExpandableCardsBlockProps> = ({ props }) => {
  const source = props.cards?.length ? props.cards : FALLBACK;
  const cards: ExpandableCard[] = source.map((c) => ({
    title: c.title ?? '',
    description: c.description ?? '',
    src: c.src ?? '',
    ctaText: c.ctaText ?? 'Abrir',
    ctaLink: c.ctaLink ?? '#',
    content: c.content ?? '',
  }));
  return <ExpandableCards cards={cards} />;
};

export const definition = defineBlock<ExpandableCardsBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
