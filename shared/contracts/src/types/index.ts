/**
 * Tipos TS derivados dos JSON Schemas via `json-schema-to-ts` (ZERO Zod).
 *
 * Os tipos são inferidos do schema `as const` — mudar o schema muda o tipo
 * automaticamente. Para schemas que usam $ref externo (por $id), o tipo é
 * composto à mão reaproveitando os tipos já derivados (sem reescrever contrato).
 */
import type { FromSchema } from 'json-schema-to-ts';
import type {
  DashboardLayoutSchema,
  BlockManifestSchema,
  ScalarDataSchema,
  SeriesDataSchema,
  CategoricalDataSchema,
  TableDataSchema,
  BlockDataResultSchema,
  DashboardDataPayloadSchema,
  BlockQueuedEventSchema,
  BlockRunningEventSchema,
  BlockDataEventSchema,
  BlockErrorEventSchema,
  ApiErrorSchema,
  DashboardSummarySchema,
  CreateDashboardRequestSchema,
  UpdateDashboardRequestSchema,
  BlockDataRequestSchema,
} from '../schemas';

// ---------- Camada 1: LAYOUT ----------
export type DashboardLayout = FromSchema<typeof DashboardLayoutSchema>;
export type Filter = DashboardLayout['filters'][number];
export type Row = DashboardLayout['rows'][number];
export type Block = Row['blocks'][number];
export type DataBinding = NonNullable<Block['dataBinding']>;
export type DataBindingParam = NonNullable<DataBinding['params']>[number];

export type FilterType = Filter['type'];
export type ArtifactStatus = 'draft' | 'published';
export type Visibility = 'private' | 'department' | 'org';

/** DashboardConfig completo (metadados + layout inline), como no doc 20. */
export type DashboardConfig = {
  id: string;
  version: number;
  status: ArtifactStatus;
  title: string;
  ownerId: string;
  departmentId?: string | null;
  visibility: Visibility;
} & DashboardLayout;

// ---------- Camada 2: CONTRATO DO BLOCO ----------
export type BlockManifest = FromSchema<typeof BlockManifestSchema>;
export type BlockKind = BlockManifest['kind'];
export type DataShape = 'scalar' | 'series' | 'categorical' | 'table';

// ---------- Shapes concretos de dados ----------
export type ScalarData = FromSchema<typeof ScalarDataSchema>;
export type SeriesData = FromSchema<typeof SeriesDataSchema>;
export type CategoricalData = FromSchema<typeof CategoricalDataSchema>;
export type TableData = FromSchema<typeof TableDataSchema>;
export type BlockData = ScalarData | SeriesData | CategoricalData | TableData;

// ---------- Payload de DADOS (batch) ----------
export type BlockState = 'idle' | 'queued' | 'running' | 'success' | 'error';
export type BlockDataResult = FromSchema<typeof BlockDataResultSchema>;
export type DashboardDataPayload = FromSchema<typeof DashboardDataPayloadSchema>;

// ---------- Eventos de Socket.IO ----------
export type BlockQueuedEvent = FromSchema<typeof BlockQueuedEventSchema>;
export type BlockRunningEvent = FromSchema<typeof BlockRunningEventSchema>;
export type BlockErrorEvent = FromSchema<typeof BlockErrorEventSchema>;
/** `result` usa $ref externo → composto à mão com BlockDataResult. */
export type BlockDataEvent = {
  dashboardId: string;
  blockId: string;
  result: BlockDataResult;
};

// ---------- DTOs de API ----------
export type ApiError = FromSchema<typeof ApiErrorSchema>;
export type DashboardSummary = FromSchema<typeof DashboardSummarySchema>;

/** `layout` usa $ref externo → composto com DashboardLayout. */
export type DashboardDetail = {
  id: string;
  title: string;
  status: ArtifactStatus;
  visibility: Visibility;
  ownerId: string;
  departmentId?: string | null;
  version?: number;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  layout: DashboardLayout;
};

export type CreateDashboardRequest = Omit<
  FromSchema<typeof CreateDashboardRequestSchema>,
  'layout'
> & { layout?: DashboardLayout };

export type UpdateDashboardRequest = Omit<
  FromSchema<typeof UpdateDashboardRequestSchema>,
  'layout'
> & { layout?: DashboardLayout };

export type BlockDataRequest = FromSchema<typeof BlockDataRequestSchema>;
