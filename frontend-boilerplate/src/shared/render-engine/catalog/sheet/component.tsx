/**
 * Bloco `sheet` (layout) — CONTÊINER fora do fluxo.
 *
 * O bloco desenha só o GATILHO (um `Button`); ao clicar, abre um `Dialog` do
 * Astryx ancorado na borda escolhida (`side`) com os FILHOS dentro.
 *
 * Os filhos chegam pelo `children` — o grid já montado pelo `BlockContainer`
 * com as props deste bloco. Antes o painel empilhava `childBlocks` num `VStack`
 * próprio, o que fazia o conteúdo do sheet ser o único do catálogo sem as
 * garantias de grade (colunas iguais, altura de linha, colapso). Uma grade só
 * para todo o motor.
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
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import type { DialogPosition } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import type { BlockGridGap, BlockItemSizing } from '../../lib/layout-options';
import type { BlockRowHeight } from '../../lib/block-sizing';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { SheetPlaceholder } from './sheet-placeholder';

type SheetSide = 'top' | 'right' | 'bottom' | 'left';
type SheetBlockProps = {
  triggerLabel?: string;
  title?: string;
  description?: string;
  side?: SheetSide;
  columns?: number;
  gap?: BlockGridGap;
  rowHeight?: BlockRowHeight;
  itemSizing?: BlockItemSizing;
};

/** Lado do manifesto → borda em que o painel encosta (`0` = colado na borda). */
const POSITION_BY_SIDE: Record<SheetSide, DialogPosition> = {
  right: { right: 0 },
  left: { left: 0 },
  top: { top: 0 },
  bottom: { bottom: 0 },
};

export const Component: BlockComponent<SheetBlockProps> = ({ props, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const side: SheetSide = props.side ?? 'right';

  return (
    <VStack hAlign="center" paddingBlock={4} data-slot="sheet" data-sheet-side={side}>
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
          content={<LayoutContent>{children ?? <SheetPlaceholder />}</LayoutContent>}
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
