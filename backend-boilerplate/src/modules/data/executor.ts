/**
 * Núcleo de execução de UM bloco (compartilhado pelo caminho INLINE do modo
 * draft e pelo WORKER da fila no modo published).
 *
 * Fluxo: pg-runner (read-only) → transform (resultado → shape) → VALIDAÇÃO contra
 * o `dataContract` do shape (`validateBlockDataByShape`) → BlockDataResult.
 *
 * É PURO em relação à infra: recebe `runQuery` por injeção (deps), então pode ser
 * testado sem Postgres real. Quem grava cache e emite socket é o worker (que
 * chama esta função) — aqui só produz o resultado (success | error).
 */
import {
  formatErrors,
  validateBlockDataByShape,
  type BlockDataResult,
} from '@dashboards/contracts';
import type { CatalogDataShape } from '@/lib/catalog';
import type {
  PgRunnerConnection,
  QueryResultShape,
  RunQueryOptions,
} from '@/lib/pg-runner';
import { applyTransform } from './transform';

export interface ExecuteBlockInput {
  blockId: string;
  connection: PgRunnerConnection;
  sql: string;
  paramsValues: unknown[];
  transform?: unknown;
  shape: CatalogDataShape | null;
  /** TTL efetivo do bloco (segundos) — só vai para o `meta`; o cache é do worker. */
  ttlSeconds?: number;
  cached?: boolean;
}

export interface ExecutorDeps {
  runQuery: (
    connection: PgRunnerConnection,
    sql: string,
    options?: RunQueryOptions,
  ) => Promise<QueryResultShape>;
}

/**
 * Executa o bloco e devolve um `BlockDataResult` (state `success` ou `error`).
 * NUNCA lança: falha de query OU resultado fora do contrato vira `state: 'error'`
 * (o worker decide se emite `block:error`).
 */
export async function executeBlockData(
  input: ExecuteBlockInput,
  deps: ExecutorDeps,
): Promise<BlockDataResult> {
  const { blockId, shape } = input;

  let result: QueryResultShape;
  try {
    result = await deps.runQuery(input.connection, input.sql, {
      params: input.paramsValues,
    });
  } catch (err) {
    return {
      blockId,
      state: 'error',
      error: {
        code: 'query_failed',
        message: err instanceof Error ? err.message : 'query execution failed',
      },
    };
  }

  // Sem shape declarado no catálogo (bloco sem dataContract): não há contrato
  // para validar — devolvemos o resultado cru como TABELA (representação genérica).
  const effectiveShape: CatalogDataShape = shape ?? 'table';

  let data: unknown;
  try {
    data = applyTransform(effectiveShape, result, input.transform);
  } catch (err) {
    return {
      blockId,
      state: 'error',
      error: {
        code: 'transform_failed',
        message: err instanceof Error ? err.message : 'transform failed',
      },
    };
  }

  // Só validamos contra o contrato quando o bloco DECLARA um shape no catálogo.
  if (shape) {
    const { valid, errors } = validateBlockDataByShape(shape, data);
    if (!valid) {
      return {
        blockId,
        state: 'error',
        error: {
          code: 'contract_violation',
          message: `result does not match dataContract (${shape}): ${formatErrors(errors)}`,
        },
      };
    }
  }

  return {
    blockId,
    state: 'success',
    shape: effectiveShape,
    data,
    meta: {
      cached: input.cached ?? false,
      ...(input.ttlSeconds !== undefined ? { ttlSeconds: input.ttlSeconds } : {}),
      executedAt: new Date().toISOString(),
      rowCount: result.rowCount,
      truncated: result.truncated,
      durationMs: result.durationMs,
    },
  };
}
