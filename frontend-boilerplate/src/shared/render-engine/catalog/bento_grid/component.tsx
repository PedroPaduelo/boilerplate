/**
 * Bloco `bento_grid` — CONTAINER de layout em mosaico "bento".
 *
 * O `BlockRenderer` injeta `childBlocks` (sub-blocos crus) + `renderChild`
 * (renderiza 1 filho). Este componente DISPÕE os filhos: cada um ocupa `span`
 * colunas e `rowSpan` linhas.
 *
 * O mosaico é declarado, não calculado: `Grid columns/rowHeight` e
 * `GridSpan columns/rows` do design system substituem o `gridTemplateColumns`
 * e o `gridColumn: span N` que antes eram montados à mão em `style`. O bloco
 * descreve a INTENÇÃO ("ocupa 6 colunas e 2 linhas"), o DS escreve o CSS.
 *
 * Sem filhos (galeria do catálogo), mostra o placeholder ilustrativo.
 */
import type { Block } from '@dashboards/contracts';
import { Grid, GridSpan } from '@astryxdesign/core/Grid';
import type { SpacingStep } from '@astryxdesign/core/Layout';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { BentoPlaceholder } from './bento-placeholder';

type Gap = 'sm' | 'md' | 'lg';
type BentoGridProps = {
  columns?: number;
  gap?: Gap;
  autoRows?: Gap;
};

/** Escala de espaçamento do DS (compacto | padrão | espaçado). */
const GAP_STEP: Record<Gap, SpacingStep> = { sm: 2, md: 4, lg: 6 };
/** Altura base de cada linha do mosaico, em px (prop `rowHeight` do `Grid`). */
const ROW_HEIGHT: Record<Gap, number> = { sm: 128, md: 176, lg: 224 };

/** Tipo do filho com `rowSpan` (extensão do contrato Block; default 1). */
type ChildBlock = Block & { rowSpan?: number };

export const Component: BlockComponent<BentoGridProps> = ({
  props,
  childBlocks,
  renderChild,
}) => {
  const columns = Math.min(12, Math.max(1, props.columns ?? 12));
  const gap = GAP_STEP[props.gap ?? 'md'] ?? GAP_STEP.md;
  const rowHeight = ROW_HEIGHT[props.autoRows ?? 'md'] ?? ROW_HEIGHT.md;

  // Sem filhos → placeholder ilustrativo (catálogo/galeria).
  if (!childBlocks?.length || !renderChild) {
    return <BentoPlaceholder columns={columns} gap={gap} rowHeight={rowHeight} />;
  }

  return (
    <Grid columns={columns} gap={gap} rowHeight={rowHeight} data-slot="bento-grid">
      {(childBlocks as ChildBlock[]).map((child) => {
        const span = Math.min(columns, Math.max(1, child.span ?? columns));
        const rowSpan = Math.max(1, child.rowSpan ?? 1);
        return (
          <GridSpan
            key={child.id}
            columns={span}
            rows={rowSpan > 1 ? rowSpan : undefined}
            data-slot="bento-cell"
          >
            {renderChild(child)}
          </GridSpan>
        );
      })}
    </Grid>
  );
};

export const definition = defineBlock<BentoGridProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
