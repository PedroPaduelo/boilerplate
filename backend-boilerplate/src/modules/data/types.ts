/**
 * Tipos internos do módulo `data` (T-C).
 *
 * O contrato externo (resposta da rota e payloads de socket) vem de
 * `@dashboards/contracts` (BlockDataResult / DashboardDataPayload / eventos).
 */
import type { CatalogDataShape } from '@/lib/catalog';
import type { DataBindingParam } from './cache';

/** Modo de execução pedido pelo cliente. */
export type DataMode = 'draft' | 'published';

/**
 * Payload do job da fila `query-exec`. NÃO carrega a senha decifrada — só o
 * `connectionId` (a senha é decifrada no worker, na hora de conectar). Assim o
 * segredo nunca repousa em texto claro no Redis/BullMQ.
 */
export interface QueryExecJobData {
  dashboardId: string;
  blockId: string;
  connectionId: string;
  sql: string;
  paramsValues: unknown[];
  transform?: unknown;
  shape: CatalogDataShape | null;
  ttlSeconds: number;
  cacheKey: string;
}

/** Bloco do layout com seu vínculo de dados já RESOLVIDO e revalidado. */
export interface ResolvedBlock {
  blockId: string;
  /** tipo do catálogo (para resolver o shape). */
  type: string;
  shape: CatalogDataShape | null;
  binding: {
    connectionId: string;
    query: string;
    params?: DataBindingParam[];
    transform?: unknown;
    ttlSeconds?: number;
  } | null;
  /**
   * Registro da Connection (para o caminho INLINE do modo draft, que decifra a
   * senha e executa na hora). Ausente quando resolvido via fila.
   */
  connectionRecord?: unknown;
  /** Preenchido quando a resolução falhou (ex.: chart/connection invisível). */
  error?: { code: string; message: string };
}
