/**
 * Orquestração do batch (assembleBatch) + resolução com visibilidade
 * (resolveBlocks). Tudo com infra/loaders injetados — sem DB/Redis/fila reais.
 *
 * Cobre: draft executa inline (bypass de cache); published HIT retorna sem
 * enfileirar; published MISS enfileira; ANTI-STAMPEDE (jobId=cacheKey dedup);
 * bloco com erro de resolução; e a revalidação de visibilidade de chart/connection.
 */
import {
  assembleBatch,
  type BatchRuntime,
} from '@/modules/data/service';
import { resolveBlocks } from '@/modules/data/block-resolver';
import type { ResolvedBlock } from '@/modules/data/types';
import type { BlockDataResult } from '@dashboards/contracts';
import type { ActorContext } from '@/lib/rbac';

function resolvedBlock(over: Partial<ResolvedBlock> = {}): ResolvedBlock {
  return {
    blockId: 'b1',
    type: 'bar_chart',
    shape: 'series',
    binding: { connectionId: 'c1', query: 'SELECT x,y FROM t', ttlSeconds: 3600 },
    connectionRecord: {},
    ...over,
  };
}

/** Runtime fake com fila deduplicada por jobId=cacheKey (mimetiza o BullMQ). */
function fakeRuntime(over: Partial<BatchRuntime> = {}) {
  const enqueuedKeys = new Set<string>();
  const inlineCalls: string[] = [];
  const cacheGets: string[] = [];
  const runtime: BatchRuntime = {
    cacheGetData: async (key) => {
      cacheGets.push(key);
      return null;
    },
    enqueue: async (job) => {
      enqueuedKeys.add(job.cacheKey); // dedupe por jobId=cacheKey
    },
    executeInline: async (block) => {
      inlineCalls.push(block.blockId);
      return { blockId: block.blockId, state: 'success', shape: 'series', data: [] };
    },
    ...over,
  };
  return { runtime, enqueuedKeys, inlineCalls, cacheGets };
}

describe('data/service — assembleBatch', () => {
  it('draft: executa inline e NÃO toca cache nem fila', async () => {
    const { runtime, enqueuedKeys, inlineCalls, cacheGets } = fakeRuntime();
    const blocks = await assembleBatch('dash1', [resolvedBlock()], 'draft', {}, runtime);
    expect(blocks.b1.state).toBe('success');
    expect(inlineCalls).toEqual(['b1']);
    expect(enqueuedKeys.size).toBe(0);
    expect(cacheGets).toHaveLength(0);
  });

  it('published HIT: retorna do cache (meta.cached=true) sem enfileirar', async () => {
    const cachedResult: BlockDataResult = {
      blockId: 'b1', state: 'success', shape: 'series', data: [{ x: 'Jan', y: 1 }], meta: {},
    };
    const { runtime, enqueuedKeys } = fakeRuntime({
      cacheGetData: async () => JSON.stringify(cachedResult),
    });
    const blocks = await assembleBatch('dash1', [resolvedBlock()], 'published', {}, runtime);
    expect(blocks.b1.state).toBe('success');
    expect(blocks.b1.meta?.cached).toBe(true);
    expect(enqueuedKeys.size).toBe(0);
  });

  it('published MISS: enfileira (state=queued)', async () => {
    const { runtime, enqueuedKeys } = fakeRuntime();
    const blocks = await assembleBatch('dash1', [resolvedBlock()], 'published', {}, runtime);
    expect(blocks.b1.state).toBe('queued');
    expect(enqueuedKeys.size).toBe(1);
  });

  it('ANTI-STAMPEDE: dois blocos com mesmo conn/sql/params → 1 job só (jobId=cacheKey)', async () => {
    const { runtime, enqueuedKeys } = fakeRuntime();
    const b1 = resolvedBlock({ blockId: 'b1' });
    const b2 = resolvedBlock({ blockId: 'b2' }); // mesmo binding/params ⇒ mesma cacheKey
    const blocks = await assembleBatch('dash1', [b1, b2], 'published', {}, runtime);
    expect(blocks.b1.state).toBe('queued');
    expect(blocks.b2.state).toBe('queued');
    expect(enqueuedKeys.size).toBe(1); // deduplicado
  });

  it('TTL=0 (tempo real) em published: nem lê cache, enfileira direto', async () => {
    const { runtime, enqueuedKeys, cacheGets } = fakeRuntime();
    const block = resolvedBlock({ binding: { connectionId: 'c1', query: 'Q', ttlSeconds: 0 } });
    const blocks = await assembleBatch('dash1', [block], 'published', {}, runtime);
    expect(blocks.b1.state).toBe('queued');
    expect(cacheGets).toHaveLength(0);
    expect(enqueuedKeys.size).toBe(1);
  });

  it('bloco com erro de resolução → state error (sem cache/fila/inline)', async () => {
    const { runtime, enqueuedKeys, inlineCalls } = fakeRuntime();
    const errBlock = resolvedBlock({
      blockId: 'bx', binding: null, error: { code: 'forbidden_chart', message: 'no' },
    });
    const blocks = await assembleBatch('dash1', [errBlock], 'published', {}, runtime);
    expect(blocks.bx.state).toBe('error');
    expect(blocks.bx.error?.code).toBe('forbidden_chart');
    expect(enqueuedKeys.size).toBe(0);
    expect(inlineCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------

const CTX: ActorContext = { userId: 'u1', role: 'CREATOR', departmentIds: ['dep1'] };

const VISIBLE_CONN = { ownerId: 'someone', visibility: 'ORG', departmentId: null };
const PRIVATE_CONN = { ownerId: 'someone-else', visibility: 'PRIVATE', departmentId: null };

describe('data/block-resolver — resolveBlocks (visibilidade)', () => {
  it('bloco com dataBinding direto + connection visível → resolvido', async () => {
    const layout = {
      filters: [],
      rows: [
        { id: 'r1', blocks: [
          { id: 'b1', type: 'bar_chart', span: 6, dataBinding: { connectionId: 'c1', query: 'SELECT 1' } },
        ] },
      ],
    };
    const resolved = await resolveBlocks(layout, 'published', CTX, {
      loadChart: async () => null,
      loadConnection: async () => VISIBLE_CONN,
      resolveShape: () => 'series',
    });
    expect(resolved).toHaveLength(1);
    expect(resolved[0].error).toBeUndefined();
    expect(resolved[0].binding?.connectionId).toBe('c1');
    expect(resolved[0].shape).toBe('series');
  });

  it('connection INVISÍVEL ao ator → error forbidden_connection (não hidrata)', async () => {
    const layout = {
      filters: [],
      rows: [
        { id: 'r1', blocks: [
          { id: 'b1', type: 'bar_chart', span: 6, dataBinding: { connectionId: 'cP', query: 'SELECT 1' } },
        ] },
      ],
    };
    const resolved = await resolveBlocks(layout, 'published', CTX, {
      loadChart: async () => null,
      loadConnection: async () => PRIVATE_CONN,
      resolveShape: () => 'series',
    });
    expect(resolved[0].error?.code).toBe('forbidden_connection');
    expect(resolved[0].binding).toBeNull();
  });

  it('bloco referencia chart INVISÍVEL → error forbidden_chart (não hidrata)', async () => {
    const layout = {
      filters: [],
      rows: [
        { id: 'r1', blocks: [
          { id: 'b1', type: 'bar_chart', span: 6, props: { chartId: 'chPriv' } },
        ] },
      ],
    };
    const resolved = await resolveBlocks(layout, 'published', CTX, {
      loadChart: async () => ({
        ownerId: 'other', visibility: 'PRIVATE', departmentId: null,
        catalogType: 'bar_chart',
        publishedDataBinding: { connectionId: 'c1', query: 'SELECT 1' },
      }),
      loadConnection: async () => VISIBLE_CONN,
      resolveShape: () => 'series',
    });
    expect(resolved[0].error?.code).toBe('forbidden_chart');
  });

  it('bloco via chart VISÍVEL + connection visível → binding do chart (modo published)', async () => {
    const layout = {
      filters: [],
      rows: [
        { id: 'r1', blocks: [
          { id: 'b1', type: 'placeholder', span: 6, props: { chartId: 'chOrg' } },
        ] },
      ],
    };
    const resolved = await resolveBlocks(layout, 'published', CTX, {
      loadChart: async () => ({
        ownerId: 'other', visibility: 'ORG', departmentId: null,
        catalogType: 'donut',
        publishedDataBinding: { connectionId: 'c1', query: 'SELECT label,value' },
        draftDataBinding: { connectionId: 'c1', query: 'DRAFT' },
      }),
      loadConnection: async () => VISIBLE_CONN,
      resolveShape: (type) => (type === 'donut' ? 'categorical' : null),
    });
    expect(resolved[0].error).toBeUndefined();
    expect(resolved[0].type).toBe('donut');
    expect(resolved[0].shape).toBe('categorical');
    expect(resolved[0].binding?.query).toBe('SELECT label,value');
  });

  it('blocos narrativos (sem binding/chart) são ignorados', async () => {
    const layout = {
      filters: [],
      rows: [
        { id: 'r1', blocks: [
          { id: 'titulo', type: 'title', span: 12, props: { text: 'Olá' } },
        ] },
      ],
    };
    const resolved = await resolveBlocks(layout, 'published', CTX, {
      loadChart: async () => null,
      loadConnection: async () => VISIBLE_CONN,
      resolveShape: () => null,
    });
    expect(resolved).toHaveLength(0);
  });
});
