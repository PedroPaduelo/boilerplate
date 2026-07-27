/**
 * Bloco `sheet` (layout) — CONTAINER em painel sob demanda.
 *
 * O `BlockRenderer` injeta `childBlocks` (sub-blocos crus) + `renderChild`. O
 * bloco desenha só o GATILHO (um `Button`); ao clicar, abre um `Dialog` do
 * Astryx ancorado na borda escolhida (`side`) com os FILHOS empilhados dentro.
 *
 * Por que `Dialog` e não um painel deslizante próprio: o conteúdo é uma camada
 * modal sobre a página — foco preso, Escape, backdrop e retorno de foco são
 * comportamento do DS. O `side` vira ANCORAGEM (`position`), preservando a
 * leitura de "painel que vem da direita/esquerda/topo/base".
 *
 * Sem filhos (galeria do catálogo), o painel abre com um placeholder
 * ilustrativo, comunicando o conceito.
 */
import { useState } from 'react';
import type { Block } from '@dashboards/contracts';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import type { DialogPosition } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { SheetPlaceholder } from './sheet-placeholder';

type SheetSide = 'top' | 'right' | 'bottom' | 'left';
type SheetBlockProps = {
  triggerLabel?: string;
  title?: string;
  description?: string;
  side?: SheetSide;
};

/** Lado do manifesto → borda em que o painel encosta (`0` = colado na borda). */
const POSITION_BY_SIDE: Record<SheetSide, DialogPosition> = {
  right: { right: 0 },
  left: { left: 0 },
  top: { top: 0 },
  bottom: { bottom: 0 },
};

export const Component: BlockComponent<SheetBlockProps> = ({
  props,
  childBlocks,
  renderChild,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const side: SheetSide = props.side ?? 'right';
  const children = childBlocks ?? [];
  const hasChildren = Boolean(children.length && renderChild);

  return (
    <VStack hAlign="center" paddingBlock={6} data-slot="sheet" data-sheet-side={side}>
      <Button
        variant="secondary"
        label={props.triggerLabel ?? 'Abrir painel'}
        onClick={() => setIsOpen(true)}
      />
      <Dialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        position={POSITION_BY_SIDE[side] ?? POSITION_BY_SIDE.right}
      >
        <Layout
          header={
            <DialogHeader
              // Um diálogo sem título não tem nome acessível: sem `title`, o
              // rótulo do gatilho é o melhor nome possível para o painel.
              title={props.title ?? props.triggerLabel ?? 'Detalhes'}
              subtitle={props.description}
              onOpenChange={setIsOpen}
            />
          }
          content={
            <LayoutContent>
              <VStack gap={4}>
                {hasChildren ? (
                  (children as Block[]).map((child) => (
                    <StackItem key={child.id} data-slot="sheet-child">
                      {renderChild!(child)}
                    </StackItem>
                  ))
                ) : (
                  <SheetPlaceholder />
                )}
              </VStack>
            </LayoutContent>
          }
        />
      </Dialog>
    </VStack>
  );
};

export const definition = defineBlock<SheetBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
