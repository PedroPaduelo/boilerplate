import { describe, it, expect } from 'vitest';
import { dashboardLayoutFixture } from '@dashboards/contracts';
import {
  addFilter,
  addRow,
  adjacentRowId,
  clampSpan,
  findBlock,
  layoutsEqual,
  moveBlockToAdjacentRow,
  moveBlockToRow,
  moveBlockWithinRow,
  normalizeLayout,
  removeBlock,
  removeFilter,
  removeRow,
  sanitizeLayoutForSave,
  setBlockDataBinding,
  setBlockProps,
  setBlockSpan,
  setRowTitle,
  updateBlockProps,
  updateFilter,
  validateLayoutForSave,
  type EditorLayout,
} from './layout-editor';

const base = (): EditorLayout => normalizeLayout(dashboardLayoutFixture);

describe('normalizeLayout', () => {
  it('coage o layout cru das fixtures para a forma editável', () => {
    const l = base();
    expect(l.filters.map((f) => f.id)).toEqual(['f_periodo', 'f_situacao']);
    expect(l.rows.map((r) => r.id)).toEqual(['row_intro', 'row_evolucao', 'row_detalhe']);
    expect(l.rows[0].blocks.map((b) => b.id)).toEqual([
      'blk_title',
      'blk_kpi_total',
      'blk_bar_mes',
    ]);
    // binding preservado nos blocos de dados, ausente nos narrativos
    expect(findBlock(l, 'blk_kpi_total')?.block.dataBinding?.connectionId).toBe('conn_fazenda');
    expect(findBlock(l, 'blk_title')?.block.dataBinding).toBeUndefined();
  });

  it('é idempotente (sanitize estável)', () => {
    const a = base();
    const b = normalizeLayout(sanitizeLayoutForSave(a));
    expect(layoutsEqual(a, b)).toBe(true);
  });

  it('tolera entrada inválida (objeto vazio)', () => {
    const l = normalizeLayout(undefined);
    expect(l).toEqual({ filters: [], rows: [] });
  });
});

describe('reordenar blocos', () => {
  it('moveBlockWithinRow troca blocos adjacentes (down)', () => {
    const l = moveBlockWithinRow(base(), 'row_intro', 'blk_title', 'down');
    expect(l.rows[0].blocks.map((b) => b.id)).toEqual([
      'blk_kpi_total',
      'blk_title',
      'blk_bar_mes',
    ]);
  });

  it('moveBlockWithinRow é no-op na borda (up no primeiro)', () => {
    const l0 = base();
    const l = moveBlockWithinRow(l0, 'row_intro', 'blk_title', 'up');
    expect(layoutsEqual(l, l0)).toBe(true);
  });

  it('adjacentRowId resolve vizinhos e bordas', () => {
    const l = base();
    expect(adjacentRowId(l, 'row_intro', 'down')).toBe('row_evolucao');
    expect(adjacentRowId(l, 'row_intro', 'up')).toBeNull();
    expect(adjacentRowId(l, 'row_detalhe', 'down')).toBeNull();
  });

  it('moveBlockToAdjacentRow move o bloco para a row de baixo', () => {
    const l = moveBlockToAdjacentRow(base(), 'blk_title', 'down');
    expect(findBlock(l, 'blk_title')?.row.id).toBe('row_evolucao');
    expect(l.rows[0].blocks.map((b) => b.id)).toEqual(['blk_kpi_total', 'blk_bar_mes']);
    expect(l.rows[1].blocks.at(-1)?.id).toBe('blk_title');
  });

  it('moveBlockToRow insere na posição pedida', () => {
    const l = moveBlockToRow(base(), 'blk_title', 'row_evolucao', 0);
    expect(l.rows[1].blocks[0].id).toBe('blk_title');
  });
});

describe('remover / span / props / binding', () => {
  it('removeBlock remove de qualquer row', () => {
    const l = removeBlock(base(), 'blk_donut');
    expect(findBlock(l, 'blk_donut')).toBeNull();
  });

  it('setBlockSpan faz clamp 1..12', () => {
    expect(clampSpan(99)).toBe(12);
    expect(clampSpan(0)).toBe(1);
    const l = setBlockSpan(base(), 'blk_kpi_total', 50);
    expect(findBlock(l, 'blk_kpi_total')?.block.span).toBe(12);
  });

  it('updateBlockProps mescla; setBlockProps substitui', () => {
    const merged = updateBlockProps(base(), 'blk_title', { text: 'Novo' });
    const block = findBlock(merged, 'blk_title')?.block;
    expect(block?.props?.text).toBe('Novo');
    expect(block?.props?.level).toBe(1); // preservado

    const replaced = setBlockProps(base(), 'blk_title', { text: 'X' });
    expect(findBlock(replaced, 'blk_title')?.block.props).toEqual({ text: 'X' });
  });

  it('setBlockDataBinding define e remove o binding', () => {
    const removed = setBlockDataBinding(base(), 'blk_kpi_total', undefined);
    expect(findBlock(removed, 'blk_kpi_total')?.block.dataBinding).toBeUndefined();

    const set = setBlockDataBinding(base(), 'blk_title', {
      connectionId: 'conn_x',
      query: 'SELECT 1 AS value',
    });
    expect(findBlock(set, 'blk_title')?.block.dataBinding?.connectionId).toBe('conn_x');
  });
});

describe('rows e filtros', () => {
  it('addRow / removeRow / setRowTitle', () => {
    let l = addRow(base(), 'Nova');
    expect(l.rows.at(-1)?.title).toBe('Nova');
    const newId = l.rows.at(-1)!.id;
    l = setRowTitle(l, newId, '');
    expect(l.rows.at(-1)?.title).toBeUndefined();
    l = removeRow(l, newId);
    expect(l.rows.find((r) => r.id === newId)).toBeUndefined();
  });

  it('addFilter / updateFilter / removeFilter', () => {
    let l = addFilter(base(), { id: 'f_novo', type: 'search', label: 'Busca' });
    expect(l.filters.at(-1)).toMatchObject({ id: 'f_novo', type: 'search', label: 'Busca' });
    l = updateFilter(l, 'f_novo', { label: 'Busca livre' });
    expect(l.filters.at(-1)?.label).toBe('Busca livre');
    l = removeFilter(l, 'f_novo');
    expect(l.filters.find((f) => f.id === 'f_novo')).toBeUndefined();
  });
});

describe('validateLayoutForSave (contrato doc 20)', () => {
  it('layout das fixtures é válido', () => {
    const result = validateLayoutForSave(base());
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    // payload limpo: blocos narrativos sem dataBinding, etc.
    expect(result.payload.rows).toHaveLength(3);
  });

  it('connectionId vazio invalida (feedback claro do ajv)', () => {
    const broken = setBlockDataBinding(base(), 'blk_kpi_total', {
      connectionId: '',
      query: 'SELECT 1 AS value',
    });
    const result = validateLayoutForSave(broken);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('span fora de 1..12 invalida', () => {
    // burla o clamp escrevendo direto na estrutura (simula layout corrompido)
    const l = base();
    l.rows[0].blocks[0].span = 99;
    const result = validateLayoutForSave(l);
    expect(result.valid).toBe(false);
  });
});

describe('layoutsEqual', () => {
  it('detecta mudança estrutural', () => {
    const a = base();
    const b = moveBlockWithinRow(a, 'row_intro', 'blk_title', 'down');
    expect(layoutsEqual(a, b)).toBe(false);
  });
  it('ignora identidade de referência (mesma forma → igual)', () => {
    expect(layoutsEqual(base(), base())).toBe(true);
  });
});
