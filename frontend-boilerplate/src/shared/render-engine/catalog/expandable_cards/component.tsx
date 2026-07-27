/**
 * Bloco `expandable_cards` — CONTAINER de layout (cards que expandem).
 *
 * Usa o mecanismo de container do render-engine: o `BlockRenderer` injeta
 * `childBlocks` (sub-blocos crus) + `renderChild` (renderiza 1 filho). Este
 * componente transforma cada filho num CARD da grade colapsada; ao clicar, o
 * card EXPANDE num modal mostrando o filho renderizado (gráfico/tabela/etc.).
 * Assim a IA monta `block.blocks` com a MESMA sintaxe do dashboard/section.
 *
 * Sem filhos (galeria do catálogo), mostra 3 cards de exemplo (funcionais) para
 * comunicar o conceito de "card que expande".
 */
import type { Block } from '@dashboards/contracts';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { ExpandableCards } from './expandable-cards';
import { EXAMPLE_ITEMS } from './example-items';
import type { ExpandableCardItem, ExpandableCardsGap } from './types';

type ExpandableCardsBlockProps = {
  columns?: number;
  gap?: ExpandableCardsGap;
};

const DEFAULT_COLUMNS = 3;
const DEFAULT_GAP: ExpandableCardsGap = 'md';

/** Converte um catalogType (`bar_chart`) num rótulo legível (`Bar Chart`). */
function humanizeType(type: string): string {
  return type
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Título explícito do filho (sem fallback): `block.title` ou `props.title`. */
function explicitChildTitle(child: Block): string | undefined {
  if (typeof child.title === 'string' && child.title.trim()) return child.title;
  const propsTitle = (child.props as { title?: unknown } | undefined)?.title;
  if (typeof propsTitle === 'string' && propsTitle.trim()) return propsTitle;
  return undefined;
}

export const Component: BlockComponent<ExpandableCardsBlockProps> = ({
  props,
  childBlocks,
  renderChild,
}) => {
  const columns = props.columns ?? DEFAULT_COLUMNS;
  const gap = props.gap ?? DEFAULT_GAP;

  // Sem filhos → galeria de exemplo (demonstra o comportamento de expandir).
  if (!childBlocks?.length || !renderChild) {
    return <ExpandableCards columns={columns} gap={gap} items={EXAMPLE_ITEMS} />;
  }

  const items: ExpandableCardItem[] = childBlocks.map((child) => {
    const explicit = explicitChildTitle(child);
    const typeLabel = humanizeType(child.type);
    const rendered = renderChild(child);
    return {
      id: child.id,
      title: explicit ?? typeLabel,
      // Só mostra o tipo como subtítulo quando há um título distinto.
      subtitle: explicit ? typeLabel : undefined,
      preview: rendered,
      content: rendered,
    };
  });

  return <ExpandableCards columns={columns} gap={gap} items={items} />;
};

export const definition = defineBlock<ExpandableCardsBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
