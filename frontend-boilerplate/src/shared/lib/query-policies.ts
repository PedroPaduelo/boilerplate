/**
 * Políticas de cache (staleTime) por tipo de dado — doc 32 §3.
 *
 * Regra de ouro do projeto:
 * - **draft / dev**: `staleTime: 0` → sempre refetch (edição precisa ver o dado
 *   fresco a cada mudança; nada de cache "preso").
 * - **published**: `staleTime` alto (alinhado ao TTL do bloco no backend) →
 *   evita refetch desnecessário de algo já materializado e cacheado server-side.
 * - **reference** (catálogo, conexões, departamentos): muda raramente → stale
 *   longo.
 *
 * As features importam `staleTimeFor(mode)` / as constantes ao montar as queries,
 * em vez de chutar números soltos por toda parte.
 */
import type { ApiMode } from './query-keys';

const MINUTE = 1000 * 60;

export const STALE_TIME = {
  /** Edição/dev — nunca considera fresco. */
  draft: 0,
  /** Publicado — materializado e cacheado no backend. */
  published: 5 * MINUTE,
  /** Dados de referência (catálogo, conexões, departamentos). */
  reference: 10 * MINUTE,
  /** Tempo-real (bloco hidratado via socket): o cache é empurrado por evento. */
  realtime: 0,
} as const;

export const GC_TIME = {
  default: 5 * MINUTE,
  reference: 30 * MINUTE,
} as const;

/** staleTime para leitura de artefato (dashboard/chart/dados) conforme o modo. */
export function staleTimeFor(mode: ApiMode): number {
  return mode === 'published' ? STALE_TIME.published : STALE_TIME.draft;
}

/**
 * Opções de query prontas para um artefato por modo. Açúcar para as features:
 *   useQuery({ queryKey: queryKeys.dashboards.detail(id, mode), queryFn, ...artifactQueryOptions(mode) })
 */
export function artifactQueryOptions(mode: ApiMode) {
  const draft = mode === 'draft';
  return {
    staleTime: staleTimeFor(mode),
    // No modo de edição, refaz ao focar a janela (garante fresco); publicado não.
    refetchOnWindowFocus: draft,
  } as const;
}

/** Opções para dados de referência (catálogo/conexões/departamentos). */
export function referenceQueryOptions() {
  return {
    staleTime: STALE_TIME.reference,
    gcTime: GC_TIME.reference,
    refetchOnWindowFocus: false,
  } as const;
}
