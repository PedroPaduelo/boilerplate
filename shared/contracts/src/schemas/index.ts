/** Barrel de todos os JSON Schemas neutros (fonte da verdade dos contratos). */
export { DashboardLayoutSchema, DashboardConfigSchema } from './dashboard-layout.schema';
export { BlockManifestSchema } from './block-manifest.schema';
export {
  ScalarDataSchema,
  SeriesDataSchema,
  CategoricalDataSchema,
  TableDataSchema,
} from './block-data.schema';
export { BlockDataResultSchema, DashboardDataPayloadSchema } from './data-payload.schema';
export {
  SOCKET_EVENTS,
  BlockQueuedEventSchema,
  BlockRunningEventSchema,
  BlockDataEventSchema,
  BlockErrorEventSchema,
} from './socket-events.schema';
export {
  ApiErrorSchema,
  DashboardSummarySchema,
  DashboardDetailSchema,
  CreateDashboardRequestSchema,
  UpdateDashboardRequestSchema,
  BlockDataRequestSchema,
} from './api-dto.schema';
