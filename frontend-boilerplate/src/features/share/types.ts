/**
 * Tipos da feature `share` (T-G1, lado FE) — espelham a resposta da rota PÚBLICA
 * `GET /public/:token` (T-B4). A rota expõe SOMENTE o artefato em modo PUBLISHED
 * (sem owner/visibilidade/draft, sem credenciais). Datas chegam como ISO string.
 */
export type ShareTargetType = 'DASHBOARD' | 'CHART';

/** Layout publicado (`{ filters, rows }`, doc 20). Conteúdo livre nesta camada. */
export interface PublishedLayout {
  filters: unknown[];
  rows: unknown[];
}

export interface PublicDashboard {
  id: string;
  title: string;
  publishedLayout: PublishedLayout;
  publishedAt: string;
}

export interface PublicChart {
  id: string;
  title: string;
  catalogType: string;
  publishedProps: Record<string, unknown>;
  publishedDataBinding: unknown | null;
  publishedAt: string;
}

export interface PublicArtifactResponse {
  targetType: ShareTargetType;
  expiresAt: string | null;
  dashboard?: PublicDashboard;
  chart?: PublicChart;
}

/** Motivo do bloqueio de um link público (mapeado do status HTTP). */
export type ShareBlockReason = 'revoked' | 'expired' | 'not_found' | 'error';
