/**
 * Hooks de dados da feature `share` (T-G1, FE). Usam as query-keys CENTRALIZADAS
 * (`queryKeys.share(token)`, T-E) e NÃO fazem retry em 4xx (revogado/expirado/
 * inexistente são definitivos — não adianta repetir).
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { shareApi, ShareLinkError } from './api';
import type { PublicArtifactResponse, PublicDashboardDataPayload } from './types';

export function usePublicArtifact(token: string | undefined) {
  return useQuery<PublicArtifactResponse, ShareLinkError>({
    queryKey: queryKeys.share(token ?? ''),
    queryFn: () => shareApi.open(token as string),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
  });
}

/**
 * Snapshot público de dados de um dashboard (T-G1 bugfix do share público).
 * Só faz sentido quando o token aponta para um DASHBOARD — para CHART o
 * endpoint devolve 400 e o hook entra em estado de erro (a UI não consome).
 *
 * `enabled` por default já é: só liga se houver token E o token for de
 * DASHBOARD. O componente `PublicDashboardView` passa o `enabled` derivado
 * do `data.targetType === 'DASHBOARD'`.
 */
export function usePublicData(
  token: string | undefined,
  enabled: boolean,
) {
  return useQuery<PublicDashboardDataPayload, ShareLinkError>({
    queryKey: [...queryKeys.share(token ?? ''), 'data'] as const,
    queryFn: () => shareApi.openData(token as string),
    enabled: !!token && enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // snapshot é congelado no publish; 5min está OK
  });
}