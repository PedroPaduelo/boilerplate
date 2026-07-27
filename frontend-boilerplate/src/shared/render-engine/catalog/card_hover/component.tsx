/**
 * Bloco `card_hover` (layout) — grade de cards com um halo que desliza entre
 * eles conforme o ponteiro (ou o foco de teclado) muda de card.
 *
 * A estrutura é toda do DS: `Grid` distribui, `ClickableCard` é o alvo (com
 * `label` acessível e `href`), `Heading`/`Text` escrevem. O único pedaço
 * próprio é o halo (`./card-hover-halo`) — decorativo e `aria-hidden`.
 */
import { useId, useState } from 'react';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Grid } from '@astryxdesign/core/Grid';
import { Text, Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { CardHoverSlot } from './card-hover-halo';

type HoverItem = { title?: string; description?: string; link?: string };
type CardHoverProps = { items?: HoverItem[] };

const FALLBACK: HoverItem[] = [
  { title: 'Destaque 1', description: 'Descrição do destaque.' },
  { title: 'Destaque 2', description: 'Descrição do destaque.' },
  { title: 'Destaque 3', description: 'Descrição do destaque.' },
];

/** Largura mínima de um card antes da grade quebrar para menos colunas. */
const MIN_CARD_WIDTH = 220;

export const Component: BlockComponent<CardHoverProps> = ({ props }) => {
  const haloId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const source = props.items?.length ? props.items : FALLBACK;
  const items = source.map((item, index) => ({
    title: item.title ?? '',
    description: item.description ?? '',
    link: item.link || `#${index}`,
  }));

  return (
    <Grid columns={{ minWidth: MIN_CARD_WIDTH }} data-slot="card-hover-grid">
      {items.map((item, index) => (
        <CardHoverSlot
          key={`${item.link}-${index}`}
          haloId={haloId}
          isActive={activeIndex === index}
          onActivate={() => setActiveIndex(index)}
          onDeactivate={() => setActiveIndex(null)}
        >
          <ClickableCard label={item.title} href={item.link} height="100%">
            <VStack gap={2}>
              <Heading level={4} maxLines={2}>
                {item.title}
              </Heading>
              {item.description ? (
                <Text type="supporting" maxLines={3}>
                  {item.description}
                </Text>
              ) : null}
            </VStack>
          </ClickableCard>
        </CardHoverSlot>
      ))}
    </Grid>
  );
};

export const definition = defineBlock<CardHoverProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
