/**
 * Hook de dados da página pública (T-G1). Usa `queryKeys.share(token)` (T-E) e
 * NÃO faz retry em 4xx (revogado/expirado/inexistente são definitivos — não
 * adianta repetir).
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { shareApi, ShareLinkError } from './api';
import type { PublicArtifactResponse } from './types';

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
