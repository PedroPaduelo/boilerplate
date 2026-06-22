import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/shared/lib/api-client';
import { getApiErrorMessage } from '@/shared/lib/api-error';

export type ShareTargetType = 'DASHBOARD' | 'CHART';

export interface CreateShareInput {
  targetType: ShareTargetType;
  targetId: string;
  durationSeconds: number;
}

export interface ShareLinkResponse {
  id: string;
  token: string;
  /** Path relativo da rota pública (`/public/:token`). */
  url: string;
  targetType: ShareTargetType;
  targetId: string;
  durationSeconds: number;
  firstAccessedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

/**
 * Cria um link de compartilhamento público (`POST /share`, exige `share:create`).
 * O TTL conta a partir da 1ª abertura (T-B4). Retorna o token/url para exibir.
 */
export function useCreateShare() {
  return useMutation({
    mutationFn: async (input: CreateShareInput) => {
      const { data } = await apiClient.post<ShareLinkResponse>('/share', input);
      return data;
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao criar link de compartilhamento'));
    },
  });
}
