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
import type { QueryResultShape, RunQueryOptions } from '@/lib/pg-runner';
import type { RunnerConnection } from '@/lib/query-runner';
import { applyTransform } from './transform';

/**
 * Colapsa a lista de erros do contrato numa mensagem que cabe na cabeça.
 *
 * O Ajv reporta POR ITEM: uma série de 30 dias com o eixo x no tipo errado
 * gerava `/0/x must be string,number; /1/x must be string,number; …` trinta
 * vezes. O agente lê isso, gasta contexto com trinta repetições da mesma
 * informação e ainda corre o risco de a mensagem ser truncada antes de dizer o
 * que importa. Agregando por índice, sobra `x must be string,number (em 30
 * itens)` — mesmo diagnóstico, uma linha.
 */
export function resumirErrosDeContrato(bruto: string): string {
  const itens = bruto
    .split(';')
    .map((parte) => parte.trim())
    .filter((parte) => parte !== '');
  if (itens.length <= 1) return bruto;

  const contagem = new Map<string, number>();
  for (const item of itens) {
    // `/12/x must be string,number` -> `x must be string,number`
    const semIndice = item.replace(/^\/\d+\//, '').replace(/^\//, '');
    contagem.set(semIndice, (contagem.get(semIndice) ?? 0) + 1);
  }

  return [...contagem.entries()]
    .map(([mensagem, vezes]) => (vezes > 1 ? `${mensagem} (em ${vezes} itens)` : mensagem))
    .join('; ');
}

export interface ExecuteBlockInput {
  blockId: string;
  /** Postgres ou gateway HTTP — o executor não distingue (ver `query-runner`). */
  connection: RunnerConnection;
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
    connection: RunnerConnection,
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
          message: `result does not match dataContract (${shape}): ${resumirErrosDeContrato(
            formatErrors(errors),
          )}`,
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
