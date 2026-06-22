/**
 * Tipos da feature `dashboards` (T-F2). Espelham a superfície do módulo backend
 * `dashboards` (T-B3): registro com `draftLayout`/`publishedLayout` embutidos e
 * modelo draft/published SEM histórico. Datas chegam como ISO string (JSON).
 */
import type { ApiMode } from '@/shared/lib/query-keys';

export type ArtifactVisibility = 'PRIVATE' | 'DEPARTMENT' | 'ORG';
export type ArtifactStatus = 'DRAFT' | 'PUBLISHED';

/** Layout salvo (`{ filters, rows }`, doc 20). Conteúdo livre nesta camada. */
export interface DashboardLayout {
  filters: unknown[];
  rows: unknown[];
}

export interface Dashboard {
  id: string;
  title: string;
  ownerId: string;
  departmentId: string | null;
  visibility: ArtifactVisibility;
  status: ArtifactStatus;
  draftLayout: DashboardLayout;
  publishedLayout: DashboardLayout | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Detalhe por modo (`GET /dashboards/:id?mode=`): metadados + layout resolvido. */
export interface DashboardDetail extends Dashboard {
  mode: 'draft' | 'published';
  layout: DashboardLayout;
}

export interface DashboardsResponse {
  dashboards: Dashboard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Filtros enviados à API (server-side). */
export interface DashboardListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ArtifactStatus;
  visibility?: ArtifactVisibility;
}

export interface CreateDashboardInput {
  title: string;
  draftLayout: DashboardLayout;
  departmentId?: string | null;
  visibility?: ArtifactVisibility;
}

export type { ApiMode };
