/**
 * Unit — transform RESULTADO → SHAPE (identidade por convenção + mapeamento
 * declarativo de colunas).
 */
import { applyTransform } from '@/modules/data/transform';
import type { QueryResultShape } from '@/lib/pg-runner';

function res(
  columns: string[],
  rows: Record<string, unknown>[],
): QueryResultShape {
  return {
    columns: columns.map((name) => ({ name, dataTypeID: 0 })),
    rows,
    rowCount: rows.length,
    truncated: false,
    durationMs: 1,
  };
}

describe('data/transform — identidade por convenção', () => {
  it('scalar: lê a coluna `value` (+ label/unit/delta)', () => {
    const out = applyTransform(
      'scalar',
      res(['value', 'label', 'unit', 'delta'], [{ value: 1284000, label: 'Total', unit: 'BRL', delta: 0.12 }]),
    );
    expect(out).toEqual({ value: 1284000, label: 'Total', unit: 'BRL', delta: 0.12 });
  });

  it('series: colunas x/y (+ series) e coerção de y numérico-string', () => {
    const out = applyTransform('series', res(['x', 'y'], [
      { x: 'Jan', y: 120 },
      { x: 'Fev', y: '90' },
    ]));
    expect(out).toEqual([
      { x: 'Jan', y: 120 },
      { x: 'Fev', y: 90 },
    ]);
  });

  it('categorical: colunas label/value', () => {
    const out = applyTransform('categorical', res(['label', 'value'], [
      { label: 'Quitado', value: 62 },
      { label: 'Em aberto', value: 38 },
    ]));
    expect(out).toEqual([
      { label: 'Quitado', value: 62 },
      { label: 'Em aberto', value: 38 },
    ]);
  });

  it('table: colunas do resultado viram columns; linhas passam direto', () => {
    const out = applyTransform('table', res(['municipio', 'valor'], [
      { municipio: 'Centro', valor: 1000 },
    ])) as { columns: { key: string }[]; rows: unknown[] };
    expect(out.columns.map((c) => c.key)).toEqual(['municipio', 'valor']);
    expect(out.rows).toEqual([{ municipio: 'Centro', valor: 1000 }]);
  });
});

describe('data/transform — mapeamento declarativo', () => {
  it('series com transform {x,y} apontando para colunas customizadas', () => {
    const out = applyTransform(
      'series',
      res(['mes', 'total'], [{ mes: 'Jan', total: 9 }]),
      { x: 'mes', y: 'total' },
    );
    expect(out).toEqual([{ x: 'Jan', y: 9 }]);
  });
});
