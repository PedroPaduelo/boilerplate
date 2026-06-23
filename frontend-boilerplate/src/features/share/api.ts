/**
 * Cliente das rotas PÚBLICAS do share (T-B4) — lado FE da T-G1.
 *
 * IMPORTANTE (não vazar auth): usamos uma instância axios DEDICADA, SEM os
 * interceptors do `apiClient` (que anexam o JWT do usuário e disparam logout em
 * 401). A página pública é anônima e read-only; nenhuma ação autenticada deve
 * partir dela. Assim, mesmo que um usuário logado abra o link, o token JWT NÃO
 * é enviado.
 */
import axios, { AxiosError } from 'axios';
import { env } from '@/shared/lib/env';
import type {
  PublicArtifactResponse,
  PublicDashboardDataPayload,
  ShareBlockReason,
} from './types';

/** Instância "limpa" — sem Authorization, sem redirect em 401. */
const publicClient = axios.create({
  baseURL: env.API_URL,
  headers: { 'Content-Type': 'application/json' },
});

/** Erro de domínio do link público, com o motivo do bloqueio já mapeado. */
export class ShareLinkError extends Error {
  readonly reason: ShareBlockReason;
  readonly status?: number;
  constructor(reason: ShareBlockReason, status?: number, message?: string) {
    super(message ?? reason);
    this.name = 'ShareLinkError';
    this.reason = reason;
    this.status = status;
  }
}

/** Mapeia o status HTTP da rota pública para o motivo de bloqueio. */
export function reasonFromStatus(status: number | undefined): ShareBlockReason {
  switch (status) {
    case 403:
      return 'revoked';
    case 410:
      return 'expired';
    case 404:
      return 'not_found';
    default:
      return 'error';
  }
}

export const shareApi = {
  /**
   * Abre o link público. Sucesso → artefato em modo PUBLISHED (incluindo o
   * snapshot de dados `publishedDataPayload` no caso de dashboard).
   * Falha → lança `ShareLinkError` com o motivo (revoked/expired/not_found/error).
   */
  open: async (token: string): Promise<PublicArtifactResponse> => {
    try {
      const { data } = await publicClient.get<PublicArtifactResponse>(
        `/public/${encodeURIComponent(token)}`,
      );
      return data;
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        const body = err.response?.data as { message?: string } | undefined;
        throw new ShareLinkError(reasonFromStatus(status), status, body?.message);
      }
      throw new ShareLinkError('error');
    }
  },

  /**
   * Snapshot público de dados (T-G1 bugfix do share público) — endpoint
   * dedicado `GET /public/:token/data`. Retorna o `DashboardDataPayload`
   * materializado no publish (modo `published`, blocos já no shape).
   * Em dashboards legados (publicados antes do bugfix) pode vir `blocks: {}`.
   * Mesmo mapeamento de erro do `open`.
   */
  openData: async (token: string): Promise<PublicDashboardDataPayload> => {
    try {
      const { data } = await publicClient.get<PublicDashboardDataPayload>(
        `/public/${encodeURIComponent(token)}/data`,
      );
      return data;
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        const body = err.response?.data as { message?: string } | undefined;
        throw new ShareLinkError(reasonFromStatus(status), status, body?.message);
      }
      throw new ShareLinkError('error');
    }
  },
};