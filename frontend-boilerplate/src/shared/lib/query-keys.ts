/**
 * Query-keys CENTRALIZADAS do TanStack Query (doc 32 §3).
 *
 * Fonte única das chaves de cache — as features (T-F conexões/listagens, T-G
 * dashboard/editor, T-I catálogo, T-H chat) importam daqui em vez de espalhar
 * arrays mágicos pelo código. Mudou a forma de uma chave? Muda aqui e todo
 * mundo (queries, invalidações e o socket→cache) acompanha.
 *
 * Convenções:
 * - Chaves são arrays `readonly` (`as const`) — estáveis e serializáveis.
 * - O 1º elemento é o "namespace" da entidade; use o prefixo (`queryKeys.X.all`)
 *   para invalidar tudo de uma entidade via `invalidateQueries`.
 * - `mode` é o modo de leitura do artefato: `draft` (edição/dev, sempre fresco)
 *   ou `published` (cacheável). Ver `query-policies.ts` para o staleTime.
 * - `filtersHash` é o hash estável dos filtros ativos (ver `hashFilters`) —
 *   garante uma entrada de cache por combinação de filtros.
 */

/** Modo de leitura de um artefato (param `?mode=` da API + chave de cache). */
export type ApiMode = 'draft' | 'published';

/**
 * Hash determinístico dos filtros ativos para compor a chave de cache de dados.
 * Ordena as chaves para que `{a:1,b:2}` e `{b:2,a:1}` gerem o MESMO hash.
 */
export function hashFilters(filters?: Record<string, unknown> | null): string {
  if (!filters) return '∅';
  const keys = Object.keys(filters).sort();
  if (keys.length === 0) return '∅';
  const normalized: Record<string, unknown> = {};
  for (const k of keys) normalized[k] = filters[k];
  return JSON.stringify(normalized);
}

export const queryKeys = {
  /** Sessão / usuário atual (`GET /auth/me`). */
  auth: {
    me: ['auth', 'me'] as const,
  },

  /** Catálogo de blocos (manifests) — muda raramente. */
  catalog: () => ['catalog'] as const,

  /** Departamentos (para selects/filtros de visibilidade). */
  departments: {
    all: ['departments'] as const,
    list: () => ['departments', 'list'] as const,
  },

  /** Conexões de banco externas (T-A / T-F). */
  connections: {
    all: ['connections'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['connections', 'list', filters ?? {}] as const,
    detail: (id: string) => ['connections', 'detail', id] as const,
    /** Schema introspectado da conexão (tabelas/colunas). */
    schema: (id: string) => ['connections', 'schema', id] as const,
  },

  /** Gráficos (T-B charts / T-F listagem / T-G preview). */
  charts: {
    all: ['charts'] as const,
    list: (filters?: Record<string, unknown>) => ['charts', 'list', filters ?? {}] as const,
    detail: (id: string, mode: ApiMode) => ['charts', 'detail', id, mode] as const,
  },

  /** Dashboards. */
  dashboards: {
    all: ['dashboards'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['dashboards', 'list', filters ?? {}] as const,
    /** Layout/config de UM dashboard (`GET /dashboards/:id?mode=`). Doc 32: ['dashboard', id, mode]. */
    detail: (id: string, mode: ApiMode) => ['dashboard', id, mode] as const,
  },

  /**
   * Payload de DADOS batch de um dashboard (`POST /dashboards/:id/data`).
   * É aqui que o socket→cache e o fetch batch convergem.
   */
  dashboardData: (id: string, mode: ApiMode, filtersHash: string) =>
    ['dashboard-data', id, mode, filtersHash] as const,

  /**
   * Dado de UM bloco isolado (doc 32: ['block-data', blockId, filtersHash]).
   * Atualizado pelos eventos de socket `block:data|running|error|queued`.
   */
  blockData: (blockId: string, filtersHash: string) =>
    ['block-data', blockId, filtersHash] as const,

  /** Share público (`GET /public/:token`) — sem auth. */
  share: (token: string) => ['share', token] as const,
} as const;
