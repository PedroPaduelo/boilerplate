/**
 * Bloco `grid` — o CONTÊINER de layout canônico.
 *
 * Não dispõe os filhos por conta própria: o `BlockRenderer`/`BlockContainer`
 * monta a grade a partir das PRÓPRIAS props deste bloco (`readGridOptions`) e a
 * injeta como `children`. Ou seja, este componente é só a caixa — e a caixa,
 * por padrão, não desenha nada (`variant: 'plain'`).
 *
 * Fazer a grade fora do componente é deliberado: `section` e
 * `collapsible_block` declaram as mesmas props e ganham exatamente a mesma
 * distribuição sem copiar uma linha de código. Antes cada container montava a
 * sua (`section` em 12 colunas fixas, `bento_grid` em N) e nenhum layout ficava
 * igual ao outro.
 *
 * Sem filhos (galeria do catálogo), mostra o placeholder ilustrativo.
 */
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { BlockSurface } from '../../block-surface';
import { resolveSurfaceVariant } from '../../lib/layout-options';
import type {
  BlockGridAlign,
  BlockGridGap,
  BlockItemSizing,
  BlockSurfaceVariant,
} from '../../lib/layout-options';
import { BLOCK_MAX_COLUMNS, type BlockRowHeight } from '../../lib/block-sizing';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { GridPlaceholder } from './grid-placeholder';

type GridBlockProps = {
  columns?: number;
  gap?: BlockGridGap;
  align?: BlockGridAlign;
  rowHeight?: BlockRowHeight;
  itemSizing?: BlockItemSizing;
  variant?: BlockSurfaceVariant;
};

/** Quantas faixas o placeholder mostra quando o autor não pediu `columns`. */
const DEMO_COLUMNS = 3;

export const Component: BlockComponent<GridBlockProps> = ({ props, children }) => {
  const variant = resolveSurfaceVariant(props.variant);
  const columns = Math.max(1, Math.min(BLOCK_MAX_COLUMNS, props.columns ?? DEMO_COLUMNS));

  return (
    <BlockSurface variant={variant} slot="grid">
      {children ?? <GridPlaceholder columns={columns} />}
    </BlockSurface>
  );
};

export const definition = defineBlock<GridBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
