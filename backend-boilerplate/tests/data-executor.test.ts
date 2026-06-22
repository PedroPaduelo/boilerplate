/**
 * Núcleo de execução de um bloco: query → transform → VALIDAÇÃO contra o
 * dataContract. Cobre sucesso, resultado fora do contrato (→ error) e falha de
 * query — tudo com `runQuery` injetado (sem Postgres real).
 */
import { executeBlockData } from '@/modules/data/executor';
import type { PgRunnerConnection, QueryResultShape } from '@/lib/pg-runner';

const CONN: PgRunnerConnection = {
  id: 'c1',
  host: 'h',
  port: 5432,
  database: 'd',
  user: 'u',
  password: 'secret',
};

function fakeRunQuery(result: QueryResultShape) {
  return async () => result;
}

function res(columns: string[], rows: Record<string, unknown>[]): QueryResultShape {
  return {
    columns: columns.map((name) => ({ name, dataTypeID: 0 })),
    rows,
    rowCount: rows.length,
    truncated: false,
    durationMs: 3,
  };
}

describe('data/executor — executeBlockData', () => {
  it('sucesso: valida o shape e devolve data + meta', async () => {
    const r = await executeBlockData(
      {
        blockId: 'b1',
        connection: CONN,
        sql: 'SELECT x, y FROM t',
        paramsValues: [],
        shape: 'series',
        ttlSeconds: 3600,
      },
      { runQuery: fakeRunQuery(res(['x', 'y'], [{ x: 'Jan', y: 5 }])) },
    );
    expect(r.state).toBe('success');
    expect(r.shape).toBe('series');
    expect(r.data).toEqual([{ x: 'Jan', y: 5 }]);
    expect(r.meta?.rowCount).toBe(1);
    expect(r.meta?.ttlSeconds).toBe(3600);
  });

  it('resultado fora do contrato → state error (contract_violation)', async () => {
    // y como objeto não casa com o shape series (y: number|null) → reprovado.
    const r = await executeBlockData(
      {
        blockId: 'b2',
        connection: CONN,
        sql: 'SELECT x, y FROM t',
        paramsValues: [],
        shape: 'series',
      },
      { runQuery: fakeRunQuery(res(['x', 'y'], [{ x: 'Jan', y: { nested: 1 } }])) },
    );
    expect(r.state).toBe('error');
    expect(r.error?.code).toBe('contract_violation');
  });

  it('falha de query → state error (query_failed)', async () => {
    const r = await executeBlockData(
      {
        blockId: 'b3',
        connection: CONN,
        sql: 'SELECT 1',
        paramsValues: [],
        shape: 'scalar',
      },
      {
        runQuery: async () => {
          throw new Error('boom');
        },
      },
    );
    expect(r.state).toBe('error');
    expect(r.error?.code).toBe('query_failed');
    expect(r.error?.message).toContain('boom');
  });

  it('sem shape no catálogo → devolve como table sem validar', async () => {
    const r = await executeBlockData(
      {
        blockId: 'b4',
        connection: CONN,
        sql: 'SELECT a FROM t',
        paramsValues: [],
        shape: null,
      },
      { runQuery: fakeRunQuery(res(['a'], [{ a: 1 }])) },
    );
    expect(r.state).toBe('success');
    expect(r.shape).toBe('table');
  });
});
