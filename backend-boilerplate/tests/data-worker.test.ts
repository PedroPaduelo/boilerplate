/**
 * Worker handler (processQueryExecJob): grava cache + emite socket, com infra
 * mockada. Cobre sucesso (running→data + cache), TTL=0 (sem cache), erro de
 * query (→ block:error) e conexão inexistente.
 */
import { SOCKET_EVENTS, dashboardRoom } from '@dashboards/contracts';
import { processQueryExecJob, type WorkerDeps } from '@/modules/data/worker-handler';
import type { QueryExecJobData } from '@/modules/data/types';
import type { PgRunnerConnection, QueryResultShape } from '@/lib/pg-runner';

const CONN: PgRunnerConnection = {
  id: 'c1', host: 'h', port: 5432, database: 'd', user: 'u', password: 's',
};

function seriesResult(): QueryResultShape {
  return {
    columns: [{ name: 'x', dataTypeID: 0 }, { name: 'y', dataTypeID: 0 }],
    rows: [{ x: 'Jan', y: 10 }],
    rowCount: 1,
    truncated: false,
    durationMs: 2,
  };
}

function baseJob(overrides: Partial<QueryExecJobData> = {}): QueryExecJobData {
  return {
    dashboardId: 'dash1',
    blockId: 'blk1',
    connectionId: 'c1',
    sql: 'SELECT x, y FROM t',
    paramsValues: [],
    shape: 'series',
    ttlSeconds: 3600,
    cacheKey: 'data:abc',
    ...overrides,
  };
}

function makeDeps(over: Partial<WorkerDeps> = {}) {
  const emits: { room: string; event: string; payload: any }[] = [];
  const cacheSets: { key: string; value: string; ttl: number }[] = [];
  const deps: WorkerDeps = {
    loadPgConnection: async () => CONN,
    runQuery: async () => seriesResult(),
    cacheSetData: async (key, value, ttl) => {
      cacheSets.push({ key, value, ttl });
    },
    emit: (room, event, payload) => emits.push({ room, event, payload }),
    ...over,
  };
  return { deps, emits, cacheSets };
}

describe('data/worker — processQueryExecJob', () => {
  it('sucesso: emite running e data e grava cache (TTL > 0)', async () => {
    const { deps, emits, cacheSets } = makeDeps();
    const { result } = await processQueryExecJob(baseJob(), deps);

    expect(result.state).toBe('success');
    const events = emits.map((e) => e.event);
    expect(events).toEqual([SOCKET_EVENTS.BLOCK_RUNNING, SOCKET_EVENTS.BLOCK_DATA]);
    expect(emits[0].room).toBe(dashboardRoom('dash1'));
    // payload de block:data carrega o BlockDataResult
    expect(emits[1].payload.result.state).toBe('success');
    expect(cacheSets).toHaveLength(1);
    expect(cacheSets[0]).toMatchObject({ key: 'data:abc', ttl: 3600 });
  });

  it('TTL = 0 (tempo real): emite data mas NÃO grava cache', async () => {
    const { deps, emits, cacheSets } = makeDeps();
    await processQueryExecJob(baseJob({ ttlSeconds: 0 }), deps);
    expect(cacheSets).toHaveLength(0);
    expect(emits.map((e) => e.event)).toContain(SOCKET_EVENTS.BLOCK_DATA);
  });

  it('falha de query: emite block:error e não grava cache', async () => {
    const { deps, emits, cacheSets } = makeDeps({
      runQuery: async () => {
        throw new Error('db down');
      },
    });
    const { result } = await processQueryExecJob(baseJob(), deps);
    expect(result.state).toBe('error');
    const events = emits.map((e) => e.event);
    expect(events).toEqual([SOCKET_EVENTS.BLOCK_RUNNING, SOCKET_EVENTS.BLOCK_ERROR]);
    expect(emits[1].payload.error.code).toBe('query_failed');
    expect(cacheSets).toHaveLength(0);
  });

  it('resultado fora do contrato: block:error (contract_violation), sem cache', async () => {
    const { deps, emits, cacheSets } = makeDeps({
      runQuery: async () => ({
        columns: [{ name: 'x', dataTypeID: 0 }, { name: 'y', dataTypeID: 0 }],
        rows: [{ x: 'Jan', y: { bad: 1 } }],
        rowCount: 1,
        truncated: false,
        durationMs: 1,
      }),
    });
    const { result } = await processQueryExecJob(baseJob(), deps);
    expect(result.state).toBe('error');
    expect(emits[emits.length - 1].event).toBe(SOCKET_EVENTS.BLOCK_ERROR);
    expect(emits[emits.length - 1].payload.error.code).toBe('contract_violation');
    expect(cacheSets).toHaveLength(0);
  });

  it('conexão inexistente: block:error (connection_not_found)', async () => {
    const { deps, emits } = makeDeps({ loadPgConnection: async () => null });
    const { result } = await processQueryExecJob(baseJob(), deps);
    expect(result.state).toBe('error');
    expect(result.error?.code).toBe('connection_not_found');
    expect(emits[emits.length - 1].event).toBe(SOCKET_EVENTS.BLOCK_ERROR);
  });
});
