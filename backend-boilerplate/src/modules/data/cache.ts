/**
 * Cache de DADOS (Camada 1 do doc 07/20) — helpers PUROS de chave/TTL/params.
 *
 * Chave de cache de dados (doc 31, seção 5):
 *   `data:{sha256(connId|sql|paramsValues)}`
 *
 * A chave NÃO inclui o usuário: o cache de dados é COMPARTILHADO entre usuários
 * (decisão travada no doc 31 — mesma chave para os mesmos filtros; a permissão é
 * checada no ACESSO ao dashboard, não na chave). É também o `jobId` da fila
 * BullMQ, o que garante o ANTI-STAMPEDE (2 misses do mesmo bloco/params com a
 * mesma chave = 1 job só).
 */
import { createHash } from 'node:crypto';

/** Bind de um filtro para um parâmetro posicional da query (`$1..$n`). */
export interface DataBindingParam {
  filterId: string;
  as: string;
}

/** Vínculo de dados efetivo de um bloco (do layout OU do chart referenciado). */
export interface EffectiveBinding {
  connectionId: string;
  query: string;
  params?: DataBindingParam[];
  transform?: unknown;
  ttlSeconds?: number;
}

/** Prefixo das chaves de cache de dados. */
export const DATA_CACHE_PREFIX = 'data:';

/**
 * TTL default (segundos) do cache de dados quando o bloco não declara
 * `ttlSeconds`. Configurável por env (`DATA_CACHE_DEFAULT_TTL`).
 */
export const DEFAULT_DATA_TTL_SECONDS = readPositiveInt(
  process.env.DATA_CACHE_DEFAULT_TTL,
  300,
);

/**
 * TTL (segundos) do cache de LAYOUT publicado (`dash:{id}:published`). É só um
 * teto de segurança — a invalidação real acontece no publish/unpublish (T-B3).
 * Configurável por env (`DATA_LAYOUT_CACHE_TTL`).
 */
export const LAYOUT_CACHE_TTL_SECONDS = readPositiveInt(
  process.env.DATA_LAYOUT_CACHE_TTL,
  3600,
);

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/**
 * Chave Redis do cache de LAYOUT publicado de um dashboard.
 *
 * IMPORTANTE: a string DEVE ser idêntica à usada pelo módulo `dashboards`
 * (T-B3), que INVALIDA exatamente esta chave no publish/unpublish. Mantemos a
 * mesma convenção SEM importar do módulo `dashboards` (evita acoplamento entre
 * módulos — só a string do contrato é compartilhada).
 */
export function publishedLayoutCacheKey(dashboardId: string): string {
  return `dash:${dashboardId}:published`;
}

/**
 * Resolve os VALORES posicionais dos parâmetros de um bloco a partir do mapa de
 * filtros da requisição. A ordem segue a ordem de `params` (posicional `$1..$n`).
 * Filtro ausente vira `null` (a query/transform decide o que fazer).
 */
export function resolveParamsValues(
  params: DataBindingParam[] | undefined,
  filters: Record<string, unknown> | undefined,
): unknown[] {
  if (!params || params.length === 0) return [];
  const f = filters ?? {};
  return params.map((p) => (p.filterId in f ? f[p.filterId] : null) ?? null);
}

/**
 * Calcula a chave de cache de dados (= jobId): `data:{sha256(connId|sql|params)}`.
 * Determinística para os mesmos `connectionId`, `query` e VALORES de parâmetros
 * (independe da ordem das chaves do objeto de filtros — usa o array posicional).
 */
export function computeCacheKey(
  connectionId: string,
  query: string,
  paramsValues: unknown[],
): string {
  const material = `${connectionId}|${query}|${JSON.stringify(paramsValues)}`;
  const hash = createHash('sha256').update(material).digest('hex');
  return `${DATA_CACHE_PREFIX}${hash}`;
}

/** TTL efetivo de cache de um bloco (segundos). `<= 0` ⇒ não cacheia (tempo real). */
export function effectiveTtl(binding: Pick<EffectiveBinding, 'ttlSeconds'>): number {
  const ttl = binding.ttlSeconds;
  if (ttl === undefined || ttl === null) return DEFAULT_DATA_TTL_SECONDS;
  return Math.max(0, Math.floor(ttl));
}
