/**
 * Orquestração do endpoint de dados (batch por dashboard) — T-C.
 *
 * Camadas:
 *  - `loadLayoutForBatch`: resolve o layout (draft ou published), com CACHE de
 *    LAYOUT (Camada 2: `dash:{id}:published`) e checagem de VISIBILIDADE do ator.
 *  - `resolveBlocks` (block-resolver.ts): vínculos de dados + revalidação de
 *    visibilidade de chart/connection referenciados.
 *  - `assembleBatch`: decisão por bloco (PURA, infra injetada) — draft executa
 *    inline (sem cache); published lê cache (HIT) ou enfileira (MISS, anti-stampede).
 */
import {
  formatErrors,
  validateDashboardLayout,
  type BlockDataResult,
} from '@dashboards/contracts';
import { BadRequestError, NotFoundError } from '@/http/routes/_errors';
import { prisma } from '@/lib/prisma';
import type { ActorContext } from '@/lib/rbac';
import { canViewArtifact } from '@/lib/visibility';
import { getCatalogDataShape } from '@/lib/catalog';
import { redisService } from '@/lib/redis';
import { runQuery } from '@/lib/pg-runner';
import type { Connection } from '@prisma/client';
import {
  computeCacheKey,
  effectiveTtl,
  publishedLayoutCacheKey,
  resolveParamsValues,
  LAYOUT_CACHE_TTL_SECONDS,
} from './cache';
import { resolveBlocks } from './block-resolver';
import { executeBlockData } from './executor';
import { toPgRunnerConnection } from './connection-loader';
import { addQueryExecJob } from './jobs/queue';
import type { DataMode, QueryExecJobData, ResolvedBlock } from './types';

/** Resposta do batch (compatível com `DashboardDataPayload` do contrato). */
export interface DashboardDataResponse {
  dashboardId: string;
  mode: 'dev' | 'published';
  generatedAt: string;
  blocks: Record<string, BlockDataResult>;
}

// ---------------------------------------------------------------------------
// Camada 2 — cache de LAYOUT publicado + visibilidade
// ---------------------------------------------------------------------------

/**
 * Resolve o layout do dashboard para o `mode`, checando visibilidade do ator.
 *
 * - `published`: faz uma leitura LEVE dos metadados (sem o JSON grande do layout)
 *   para a checagem de visibilidade/status e LÊ o layout do cache
 *   (`dash:{id}:published`). Em miss, carrega o `publishedLayout` do banco e
 *   popula o cache (TTL de segurança; invalidação real é no publish — T-B3).
 * - `draft`: lê o `draftLayout` direto do banco (sem cache — dev sempre fresco).
 */
export async function loadLayoutForBatch(
  dashboardId: string,
  mode: DataMode,
  ctx: ActorContext,
): Promise<unknown> {
  if (mode === 'published') {
    const meta = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { ownerId: true, visibility: true, departmentId: true, status: true },
    });
    if (!meta || !canViewArtifact(meta, ctx)) {
      throw new NotFoundError('Dashboard not found');
    }

    // tenta o cache de layout (evita transferir o JSON grande do Postgres)
    if (redisService.isReady()) {
      try {
        const cached = await redisService.getValue(publishedLayoutCacheKey(dashboardId));
        if (cached) return JSON.parse(cached) as unknown;
      } catch {
        // miss/erro → segue para o banco
      }
    }

    const full = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { publishedLayout: true, status: true },
    });
    if (!full || full.status !== 'PUBLISHED' || full.publishedLayout == null) {
      throw new BadRequestError('Dashboard has no published layout');
    }

    if (redisService.isReady()) {
      try {
        await redisService.setValue(
          publishedLayoutCacheKey(dashboardId),
          JSON.stringify(full.publishedLayout),
          LAYOUT_CACHE_TTL_SECONDS,
        );
      } catch {
        // best-effort
      }
    }
    return full.publishedLayout as unknown;
  }

  // draft → sempre do banco
  const dash = await prisma.dashboard.findUnique({ where: { id: dashboardId } });
  if (!dash || !canViewArtifact(dash, ctx)) {
    throw new NotFoundError('Dashboard not found');
  }
  return dash.draftLayout as unknown;
}

// ---------------------------------------------------------------------------
// Núcleo de decisão por bloco (PURO — infra injetada)
// ---------------------------------------------------------------------------

export interface BatchRuntime {
  /** Lê o cache de dados; `null` em miss. */
  cacheGetData: (key: string) => Promise<string | null>;
  /** Enfileira o job (jobId = cacheKey → anti-stampede). */
  enqueue: (job: QueryExecJobData) => Promise<void>;
  /** Executa o bloco AGORA (modo draft / inline). */
  executeInline: (block: ResolvedBlock, job: QueryExecJobData) => Promise<BlockDataResult>;
}

/**
 * Monta o mapa `blockId -> BlockDataResult` aplicando a política de cache/fila.
 * PURA em relação à infra (recebe `runtime`), por isso é testável sem Redis/fila.
 *
 *  - bloco com erro de resolução → `state: 'error'`;
 *  - modo `draft` → executa inline (bypass total de cache);
 *  - modo `published`:
 *      • TTL > 0 e cache HIT → `state: 'success'` (meta.cached = true);
 *      • MISS (ou TTL <= 0, tempo real) → enfileira e `state: 'queued'`.
 */
export async function assembleBatch(
  dashboardId: string,
  resolved: ResolvedBlock[],
  mode: DataMode,
  filters: Record<string, unknown>,
  runtime: BatchRuntime,
): Promise<Record<string, BlockDataResult>> {
  const blocks: Record<string, BlockDataResult> = {};

  for (const block of resolved) {
    if (block.error || !block.binding) {
      blocks[block.blockId] = {
        blockId: block.blockId,
        state: 'error',
        error: block.error ?? { code: 'no_binding', message: 'block has no data binding' },
      };
      continue;
    }

    const paramsValues = resolveParamsValues(block.binding.params, filters);
    const cacheKey = computeCacheKey(block.binding.connectionId, block.binding.query, paramsValues);
    const ttlSeconds = effectiveTtl(block.binding);
    const job: QueryExecJobData = {
      dashboardId,
      blockId: block.blockId,
      connectionId: block.binding.connectionId,
      sql: block.binding.query,
      paramsValues,
      transform: block.binding.transform,
      shape: block.shape,
      ttlSeconds,
      cacheKey,
    };

    if (mode === 'draft') {
      blocks[block.blockId] = await runtime.executeInline(block, job);
      continue;
    }

    // published
    if (ttlSeconds > 0) {
      const cached = await runtime.cacheGetData(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as BlockDataResult;
        blocks[block.blockId] = {
          ...parsed,
          blockId: block.blockId,
          meta: { ...(parsed.meta ?? {}), cached: true },
        };
        continue;
      }
    }

    await runtime.enqueue(job);
    blocks[block.blockId] = { blockId: block.blockId, state: 'queued' };
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Orquestração com infra REAL
// ---------------------------------------------------------------------------

/** Runtime real: cache via Redis, fila via BullMQ, inline via pg-runner. */
export const realRuntime: BatchRuntime = {
  cacheGetData: async (key) => {
    if (!redisService.isReady()) return null;
    try {
      return await redisService.getValue(key);
    } catch {
      return null;
    }
  },
  enqueue: async (job) => {
    await addQueryExecJob(job);
  },
  executeInline: async (block, job) => {
    const conn = block.connectionRecord as Connection | undefined;
    if (!conn) {
      return {
        blockId: job.blockId,
        state: 'error',
        error: { code: 'connection_not_found', message: 'connection not resolved' },
      };
    }
    return executeBlockData(
      {
        blockId: job.blockId,
        connection: toPgRunnerConnection(conn),
        sql: job.sql,
        paramsValues: job.paramsValues,
        transform: job.transform,
        shape: job.shape,
        ttlSeconds: job.ttlSeconds,
        cached: false,
      },
      { runQuery },
    );
  },
};

/** Ponto de entrada usado pela rota: resolve layout → blocos → monta o batch. */
export async function buildDashboardData(
  dashboardId: string,
  mode: DataMode,
  filters: Record<string, unknown>,
  ctx: ActorContext,
): Promise<DashboardDataResponse> {
  const layout = await loadLayoutForBatch(dashboardId, mode, ctx);

  // defensivo: o que veio do cache/banco deve ser um layout válido.
  if (!validateDashboardLayout(layout)) {
    throw new BadRequestError(
      `Invalid dashboard layout: ${formatErrors(validateDashboardLayout.errors)}`,
    );
  }

  const resolved = await resolveBlocks(layout, mode, ctx, {
    loadChart: (id) =>
      prisma.chart.findUnique({
        where: { id },
        select: {
          ownerId: true,
          visibility: true,
          departmentId: true,
          catalogType: true,
          publishedDataBinding: true,
          draftDataBinding: true,
        },
      }),
    loadConnection: (id) => prisma.connection.findUnique({ where: { id } }),
    resolveShape: (type) => getCatalogDataShape(type),
  });

  const blocks = await assembleBatch(dashboardId, resolved, mode, filters, realRuntime);

  return {
    dashboardId,
    mode: mode === 'draft' ? 'dev' : 'published',
    generatedAt: new Date().toISOString(),
    blocks,
  };
}
