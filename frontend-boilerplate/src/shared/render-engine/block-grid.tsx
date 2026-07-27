/**
 * BlockGrid — o grid de 12 colunas em que todo bloco é posicionado.
 *
 * `span` (1..12) é a largura declarada pelo layout e `rowSpan` (opcional) a
 * altura, para mosaicos/bento. Quem traduz isso para CSS é o `Grid`/`GridSpan`
 * do design system: o motor descreve a INTENÇÃO ("ocupa 6 colunas"), não a
 * regra de grid — por isso aqui não existe `style` inline nem cálculo de
 * `grid-column` na mão.
 */
import type { ReactNode } from 'react';
import type { Block } from '@dashboards/contracts';
import { Grid, GridSpan } from '@astryxdesign/core/Grid';

/** Total de colunas do grid do dashboard (contrato de LAYOUT). */
const GRID_COLUMNS = 12;

export interface BlockGridProps {
  blocks: Block[];
  /** Renderiza UM bloco (com a moldura/estado certos). */
  renderBlock: (block: Block) => ReactNode;
  /** `data-slot` do container — usado para inspeção do DOM. */
  slot: string;
  /** `data-slot` de cada célula. */
  cellSlot: string;
}

export function BlockGrid({ blocks, renderBlock, slot, cellSlot }: BlockGridProps) {
  return (
    <Grid columns={GRID_COLUMNS} gap={4} data-slot={slot}>
      {blocks.map((block) => {
        const rowSpan = (block as { rowSpan?: number }).rowSpan ?? 1;
        return (
          <GridSpan
            key={block.id}
            columns={block.span ?? GRID_COLUMNS}
            rows={rowSpan > 1 ? rowSpan : undefined}
            data-slot={cellSlot}
          >
            {renderBlock(block)}
          </GridSpan>
        );
      })}
    </Grid>
  );
}
