/**
 * Validador neutro reutilizável (ajv) — funciona em qualquer lado (BE/FE/MCP),
 * SEM dependencia de Zod. Compila os JSON Schemas `as const` e expõe validadores
 * pré-compilados + helpers genéricos.
 *
 * Uso (runtime validation):
 *   import { validateDashboardLayout, assertValid, formatErrors } from '@dashboards/contracts';
 *   if (!validateDashboardLayout(input)) throw new Error(formatErrors(validateDashboardLayout.errors));
 */
import Ajv from 'ajv';
import type { AnySchema, ErrorObject, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

import {
  DashboardLayoutSchema,
  DashboardConfigSchema,
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
  DashboardDetailSchema,
  CreateDashboardRequestSchema,
  UpdateDashboardRequestSchema,
  BlockDataRequestSchema,
} from '../schemas';
import type {
  DashboardLayout,
  DashboardConfig,
  BlockManifest,
  ScalarData,
  SeriesData,
  CategoricalData,
  TableData,
  BlockDataResult,
  DashboardDataPayload,
  BlockQueuedEvent,
  BlockRunningEvent,
  BlockDataEvent,
  BlockErrorEvent,
  ApiError,
  DashboardSummary,
  DashboardDetail,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  BlockDataRequest,
} from '../types';

/** Instância ajv compartilhada. `strict:false` aceita $defs/keywords anotativos. */
export const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// `as const` deixa os schemas readonly-profundos; ajv aceita schema mutável.
const asSchema = (s: unknown): AnySchema => s as AnySchema;

/**
 * Schemas referenciados por $ref (via $id) precisam estar registrados ANTES de
 * compilar quem os referencia. Registramos os "base" primeiro.
 */
for (const base of [DashboardLayoutSchema, BlockDataResultSchema]) {
  if (!ajv.getSchema((base as { $id: string }).$id)) {
    ajv.addSchema(asSchema(base));
  }
}

function compile<T>(schema: unknown): ValidateFunction<T> {
  const id = (schema as { $id?: string }).$id;
  if (id) {
    const existing = ajv.getSchema<T>(id);
    if (existing) return existing as ValidateFunction<T>;
  }
  return ajv.compile<T>(asSchema(schema));
}

// ---------- Validadores pré-compilados ----------
export const validateDashboardLayout = compile<DashboardLayout>(DashboardLayoutSchema);
export const validateDashboardConfig = compile<DashboardConfig>(DashboardConfigSchema);
export const validateBlockManifest = compile<BlockManifest>(BlockManifestSchema);

export const validateScalarData = compile<ScalarData>(ScalarDataSchema);
export const validateSeriesData = compile<SeriesData>(SeriesDataSchema);
export const validateCategoricalData = compile<CategoricalData>(CategoricalDataSchema);
export const validateTableData = compile<TableData>(TableDataSchema);

export const validateBlockDataResult = compile<BlockDataResult>(BlockDataResultSchema);
export const validateDashboardDataPayload =
  compile<DashboardDataPayload>(DashboardDataPayloadSchema);

export const validateBlockQueuedEvent = compile<BlockQueuedEvent>(BlockQueuedEventSchema);
export const validateBlockRunningEvent = compile<BlockRunningEvent>(BlockRunningEventSchema);
export const validateBlockDataEvent = compile<BlockDataEvent>(BlockDataEventSchema);
export const validateBlockErrorEvent = compile<BlockErrorEvent>(BlockErrorEventSchema);

export const validateApiError = compile<ApiError>(ApiErrorSchema);
export const validateDashboardSummary = compile<DashboardSummary>(DashboardSummarySchema);
export const validateDashboardDetail = compile<DashboardDetail>(DashboardDetailSchema);
export const validateCreateDashboardRequest =
  compile<CreateDashboardRequest>(CreateDashboardRequestSchema);
export const validateUpdateDashboardRequest =
  compile<UpdateDashboardRequest>(UpdateDashboardRequestSchema);
export const validateBlockDataRequest = compile<BlockDataRequest>(BlockDataRequestSchema);

/** Valida o `data` de um BlockDataResult conforme o shape declarado. */
export function validateBlockDataByShape(
  shape: 'scalar' | 'series' | 'categorical' | 'table',
  data: unknown,
): { valid: boolean; errors: ErrorObject[] | null } {
  const fn =
    shape === 'scalar'
      ? validateScalarData
      : shape === 'series'
        ? validateSeriesData
        : shape === 'categorical'
          ? validateCategoricalData
          : validateTableData;
  const valid = fn(data) as boolean;
  return { valid, errors: valid ? null : (fn.errors ?? null) };
}

/** Formata os erros do ajv em uma string legível. */
export function formatErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return 'sem erros';
  return errors
    .map((e) => `${e.instancePath || '(root)'} ${e.message ?? ''}`.trim())
    .join('; ');
}

export class ContractValidationError extends Error {
  readonly errors: ErrorObject[];
  constructor(label: string, errors: ErrorObject[] | null | undefined) {
    super(`Contrato inválido (${label}): ${formatErrors(errors)}`);
    this.name = 'ContractValidationError';
    this.errors = errors ?? [];
  }
}

/**
 * Valida `data` com um validador e RETORNA o valor tipado, ou lança
 * ContractValidationError. Útil para guardas em rotas/worker/MCP.
 */
export function assertValid<T>(
  validate: ValidateFunction<T>,
  data: unknown,
  label = 'payload',
): T {
  if (!validate(data)) {
    throw new ContractValidationError(label, validate.errors);
  }
  return data as T;
}
