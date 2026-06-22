/**
 * Tipos da feature `charts` (T-F2). Espelham a superfície do módulo backend
 * `charts` (T-B2): Chart com `draftProps`/`draftDataBinding` embutidos e modelo
 * draft/published SEM histórico. Datas chegam como ISO string (JSON).
 */
export type ArtifactVisibility = 'PRIVATE' | 'DEPARTMENT' | 'ORG';
export type ArtifactStatus = 'DRAFT' | 'PUBLISHED';

/** Vínculo de dados do gráfico (doc 30). Conteúdo livre nesta camada. */
export interface DataBinding {
  connectionId: string;
  query: string;
  params?: unknown[];
  transform?: unknown;
  ttlSeconds?: number;
}

export interface Chart {
  id: string;
  title: string;
  catalogType: string;
  ownerId: string;
  departmentId: string | null;
  visibility: ArtifactVisibility;
  status: ArtifactStatus;
  draftProps: Record<string, unknown>;
  draftDataBinding: DataBinding;
  publishedProps: Record<string, unknown> | null;
  publishedDataBinding: DataBinding | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChartsResponse {
  charts: Chart[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Filtros enviados à API (server-side). */
export interface ChartListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ArtifactStatus;
  visibility?: ArtifactVisibility;
  catalogType?: string;
}

export interface CreateChartInput {
  title: string;
  catalogType: string;
  draftProps: Record<string, unknown>;
  draftDataBinding: DataBinding;
  departmentId?: string | null;
  visibility?: ArtifactVisibility;
}
