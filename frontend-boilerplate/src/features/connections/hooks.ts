import { useQuery } from '@tanstack/react-query';
import { connectionsApi, departmentsApi } from './api';
import { queryKeys } from '@/shared/lib/query-keys';
import { referenceQueryOptions } from '@/shared/lib/query-policies';
import type { ConnectionFilters } from './types';

/**
 * Hooks de LEITURA da feature `connections`.
 *
 * - Query-keys CENTRALIZADAS (`queryKeys.connections...`) — nada de strings
 *   soltas.
 * - Conexão é dado de "referência" (muda raramente) → `referenceQueryOptions()`
 *   (staleTime longo), conforme `query-policies`.
 *
 * As mutações moram em `./mutations` (o arquivo passava do limite de linhas) e
 * são reexportadas aqui: quem consome continua importando de `../hooks`.
 */

export {
  useCreateConnection,
  useUpdateConnection,
  useDeleteConnection,
  useTestConnection,
  useRunConnectionQuery,
} from './mutations';

/**
 * `options.enabled` permite que telas agregadoras (ex.: a Visão geral) só
 * disparem a busca quando o papel do usuário tem `connections:use` — sem isso
 * um VIEWER geraria um 403 previsível a cada carregamento.
 */
export function useConnections(
  filters: ConnectionFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.connections.list(filters as Record<string, unknown>),
    queryFn: () => connectionsApi.list(filters),
    enabled: options.enabled ?? true,
    ...referenceQueryOptions(),
  });
}

export function useConnection(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.connections.detail(id ?? ''),
    queryFn: () => connectionsApi.getById(id as string),
    enabled: !!id,
    ...referenceQueryOptions(),
  });
}

/**
 * Schema introspectado de uma conexão. `enabled` controla a busca lazy (só
 * dispara quando o explorer abre).
 */
export function useConnectionSchema(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.connections.schema(id ?? ''),
    queryFn: () => connectionsApi.getSchema(id as string),
    enabled: !!id && enabled,
    ...referenceQueryOptions(),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments.list(),
    queryFn: () => departmentsApi.list(),
    ...referenceQueryOptions(),
  });
}
