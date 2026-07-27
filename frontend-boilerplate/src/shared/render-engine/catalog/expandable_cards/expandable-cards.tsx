/**
 * COMPONENTE PRÓPRIO — o Astryx cobre as PEÇAS (Grid, ClickableCard, Dialog),
 * mas não a COREOGRAFIA "grade de cards em que cada card abre o seu próprio
 * conteúdo em modal, um por vez". Esta é a regra de composição do bloco:
 * um único `activeId` decide qual card está aberto. O que é decorativo aqui é
 * a miniatura do card (`preview`) — o resto é DS puro.
 *
 * O QUE DEIXOU DE SER PRÓPRIO (era, no efeito legado): backdrop, trava de
 * scroll do `body`, listener de `Escape`, clique fora e armadilha de foco.
 * Tudo isso agora é o `Dialog` do DS sobre `<dialog>` nativo — que também
 * devolve o foco ao card de origem ao fechar, de graça.
 *
 * Reescrito sobre tokens: miniatura com `--color-background-muted`,
 * `--color-border`, `--radius-inner` e `--spacing-*`; largura do modal em
 * múltiplo de `--spacing-12`. Zero hex, zero px.
 *
 * ESTILO (regra 2.3): espaçamento e largura saem de props do DS (`padding`,
 * `gap`, `width`); a moldura da miniatura sai de utilities com token. Nenhum
 * `style` inline neste arquivo.
 *
 * A11Y: `aria-haspopup="dialog"` + `aria-expanded` marcam o card de origem;
 * `purpose="info"` mantém Escape e clique no backdrop; o `DialogHeader` traz o
 * botão de fechar rotulado. A miniatura é `aria-hidden` (o conteúdo real está
 * no modal, não nela). Nota de ARIA: `aria-expanded` viaja na raiz do
 * `ClickableCard` — o botão acessível é gerado dentro do DS e não aceita
 * atributos extras; para modal, quem carrega o estado de fato é o próprio
 * diálogo (foco + título anunciados na abertura).
 */
import { useState, type ReactNode } from 'react';
import { Maximize2 } from 'lucide-react';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { Text, Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { ExpandableCardItem, ExpandableCardsGap } from './types';

/** `gap` do bloco → passo da escala de espaçamento do DS. */
const GAP_STEP: Record<ExpandableCardsGap, 2 | 4 | 6> = { sm: 2, md: 4, lg: 6 };

/**
 * Moldura da miniatura, em utilities com token: no máximo 4 passos de
 * `--spacing-8` de altura, traço e superfície vindos do tema.
 */
const PREVIEW_CLASS = [
  'pointer-events-none relative overflow-hidden',
  'max-h-[calc(var(--spacing-8)_*_4)]',
  'rounded-[var(--radius-inner)]',
  '[border:var(--border-width)_solid_var(--color-border)]',
  'bg-[color:var(--color-background-muted)]',
].join(' ');

/** Largura do modal — 16 passos de `--spacing-12`. */
const DIALOG_INLINE_SIZE = 'calc(var(--spacing-12) * 16)';

/** Limites de colunas aceitos pelo `propsSchema`. */
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 4;

/**
 * Miniatura do card colapsado. É uma janela recortada sobre o conteúdo real —
 * `aria-hidden` e sem eventos, porque o conteúdo de verdade vive no modal.
 */
function ExpandablePreview({ children }: { children: ReactNode }) {
  return (
    <VStack
      aria-hidden="true"
      data-slot="expandable-card-preview"
      padding={2}
      className={PREVIEW_CLASS}
    >
      {children}
    </VStack>
  );
}

export interface ExpandableCardsProps {
  /** Cards da grade colapsada. */
  items: ExpandableCardItem[];
  /** Colunas da grade (1..4). */
  columns: number;
  /** Espaçamento entre os cards. */
  gap: ExpandableCardsGap;
}

/** Grade de cards em que cada card expande para um modal com seu conteúdo. */
export function ExpandableCards({ items, columns, gap }: ExpandableCardsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = items.find((item) => item.id === activeId) ?? null;
  const cols = Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, Math.round(columns)));
  const close = () => setActiveId(null);

  return (
    <div data-slot="expandable-cards">
      <Grid columns={cols} gap={GAP_STEP[gap]} data-slot="expandable-cards-grid">
        {items.map((item) => (
          <ClickableCard
            key={item.id}
            data-slot="expandable-card"
            label={item.title}
            height="100%"
            aria-haspopup="dialog"
            aria-expanded={activeId === item.id}
            onClick={() => setActiveId(item.id)}
          >
            <VStack gap={3}>
              <HStack gap={2} vAlign="start" hAlign="between">
                <VStack gap={0.5}>
                  <Heading level={4} maxLines={1}>
                    {item.title}
                  </Heading>
                  {item.subtitle ? (
                    <Text type="supporting" maxLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </VStack>
                <Icon icon={Maximize2} size="sm" color="secondary" />
              </HStack>
              {item.preview ? (
                <ExpandablePreview>{item.preview}</ExpandablePreview>
              ) : null}
            </VStack>
          </ClickableCard>
        ))}
      </Grid>

      {active ? (
        <Dialog
          isOpen
          onOpenChange={close}
          purpose="info"
          width={DIALOG_INLINE_SIZE}
          padding={0}
        >
          <Layout
            header={
              <DialogHeader
                title={active.title}
                subtitle={active.subtitle}
                onOpenChange={close}
              />
            }
            content={<LayoutContent isScrollable>{active.content}</LayoutContent>}
          />
        </Dialog>
      ) : null}
    </div>
  );
}
