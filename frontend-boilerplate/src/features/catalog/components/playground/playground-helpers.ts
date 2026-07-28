/**
 * Funções PURAS do playground — sem React, sem UI.
 *
 * Ficam separadas dos componentes porque são a parte testável (montagem das
 * props iniciais, validação do JSON contra o shape, montagem do bloco/resultado
 * de preview) e porque manter isso dentro do componente foi o que fez o arquivo
 * original passar de 1300 linhas.
 */
import {
  formatErrors,
  validateBlockDataByShape,
  type Block,
  type BlockDataResult,
  type BlockManifest,
  type DataShape,
} from '@dashboards/contracts';
import { isAccentColor } from '@/shared/render-engine/lib/accent';
import type { CatalogEntry } from '../../lib/catalog-entries';
import type {
  PlaygroundConfig,
  PropField,
  PropSchema,
  PropsSchemaLike,
  Takeaway,
} from './types';

// Reexporta a fonte ÚNICA: o card da grade e o playground precisam mostrar o
// MESMO exemplo. Enquanto cada um tinha a sua cópia, o `rich_text` aparecia
// preenchido no card e vazio ao abrir.
export { previewPropsFor } from '../../lib/preview-props';

/** Lista as props configuráveis do bloco, na ordem do `propsSchema`. */
export function fieldsFromSchema(manifest: BlockManifest): PropField[] {
  const propsSchema = manifest.propsSchema as PropsSchemaLike | undefined;
  const required = propsSchema?.required ?? [];
  return Object.entries(propsSchema?.properties ?? {}).map(([key, schema]) => ({
    key,
    schema,
    required: required.includes(key),
  }));
}

/**
 * Valor inicial de uma prop quando o schema não traz `default`.
 *
 * O fallback respeita o TIPO declarado — em especial `array`, que antes caía no
 * `''` final e injetava uma string onde o bloco itera uma lista.
 */
function fallbackValue(schema: PropSchema): unknown {
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  if (schema.type === 'boolean') return false;
  if (schema.type === 'number' || schema.type === 'integer') return 0;
  if (schema.type === 'array') return [];
  if (schema.type === 'object') return {};
  return '';
}

/** `defaultProps` do manifesto + props de preview/semeadas + defaults do schema. */
export function initialPropsFor(
  manifest: BlockManifest,
  seededProps: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    ...((manifest.defaultProps as Record<string, unknown>) ?? {}),
    ...(seededProps ?? {}),
  };
  for (const field of fieldsFromSchema(manifest)) {
    if (!(field.key in out)) out[field.key] = fallbackValue(field.schema);
  }
  return out;
}

/**
 * Dado inicial do painel "Dados": prefere `dataContract.example`, cai pro
 * `definition.fixture`, e por fim `null`.
 */
export function initialDataFor(entry: CatalogEntry): unknown {
  const example = entry.definition.manifest.dataContract?.example;
  if (example !== undefined) return example;
  return entry.definition.fixture ?? null;
}

/** Nomes de prop que abrem o editor de cor mesmo sem enum explícito. */
const COLOR_PROP_NAMES = new Set(['accent', 'accentColor', 'paletteColor']);

function isAccentEnum(enumValues: readonly unknown[]): boolean {
  if (!enumValues.length) return false;
  return enumValues.every(
    (v) => typeof v === 'string' && isAccentColor(v.startsWith('bg-') ? v.slice(3) : v),
  );
}

/** A prop representa uma cor (enum de acento do DS ou nome conhecido)? */
export function isColorProp(key: string, schema: PropSchema): boolean {
  if (COLOR_PROP_NAMES.has(key)) return true;
  if (/color$/i.test(key)) return true;
  return Boolean(schema.enum && isAccentEnum(schema.enum));
}

/** Tipos de bloco que JÁ SÃO cards próprios (espelha `SELF_CONTAINED`). */
const SELF_CONTAINED_TYPES = new Set(['kpi', 'metric_glow', 'stat_tile', 'signal_card']);

/** O bloco recebe a moldura `ChartWidget` (header/rodapé com takeaways)? */
export function isFramedChart(entry: CatalogEntry): boolean {
  return entry.kind === 'chart' && !SELF_CONTAINED_TYPES.has(entry.type);
}

/** Lê `meta.durationMs` de um `BlockDataResult` de forma segura. */
export function durationOfResult(
  result: BlockDataResult | undefined,
): number | undefined {
  if (result && typeof result === 'object' && 'meta' in result) {
    return (result as { meta?: { durationMs?: number } }).meta?.durationMs;
  }
  return undefined;
}

/**
 * Valida um dado já parseado contra o shape do bloco. Devolve a mensagem de
 * erro (para o `FieldStatus`) ou `null` quando válido.
 */
function validateShape(shape: DataShape | undefined, data: unknown): string | null {
  if (!shape) return null;
  const { valid, errors } = validateBlockDataByShape(shape, data);
  return valid ? null : formatErrors(errors);
}

/** Parseia o texto do editor e valida — erro de sintaxe vira mensagem também. */
export function parseAndValidate(
  shape: DataShape | undefined,
  text: string,
): { data: unknown; error: string | null } {
  try {
    const parsed: unknown = JSON.parse(text);
    return { data: parsed, error: validateShape(shape, parsed) };
  } catch (e) {
    return { data: undefined, error: e instanceof Error ? e.message : 'JSON inválido' };
  }
}

/** Serializa um dado para o editor com indentação estável. */
export function toJsonText(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}

/**
 * Bloco de preview: o `Block` do contrato + os dois campos que o
 * `BlockRenderer` lê do bloco para montar o rodapé do `ChartWidget`
 * (`takeaways` e `showSql` são extensões de render, não do contrato).
 */
export interface PreviewBlock extends Block {
  takeaways?: Takeaway[];
  showSql?: boolean;
}

/** Monta o bloco de preview (props + wrapper `ChartWidget`) para o renderer. */
export function buildPreviewBlock(
  type: string,
  config: PlaygroundConfig,
  hasTakeaways: boolean,
): PreviewBlock {
  const title = config.title.trim();
  const subtitle = config.subtitle.trim();
  const query = config.query.trim();
  const takeaways = hasTakeaways
    ? config.takeaways.filter((t) => t.enabled && t.text.trim().length > 0)
    : [];
  return {
    id: type,
    type,
    span: 12,
    props: config.props,
    ...(title ? { title } : {}),
    ...(subtitle ? { subtitle } : {}),
    // `connectionId` não existe no playground: o rodapé só usa a query.
    ...(config.showSql && query ? { dataBinding: { connectionId: '', query } } : {}),
    ...(takeaways.length > 0 ? { takeaways } : {}),
    ...(config.showSql ? {} : { showSql: false }),
  };
}

/** Monta o `BlockDataResult` de preview a partir do JSON válido do editor. */
export function buildPreviewResult(
  entry: CatalogEntry,
  data: unknown,
  hasError: boolean,
  durationMs: number | '',
): BlockDataResult | undefined {
  if (!entry.shape || hasError || data === undefined) return undefined;
  const duration =
    typeof durationMs === 'number' && Number.isFinite(durationMs)
      ? durationMs
      : undefined;
  return {
    blockId: entry.type,
    state: 'success',
    shape: entry.shape,
    data,
    ...(duration !== undefined ? { meta: { durationMs: duration } } : {}),
  } as BlockDataResult;
}
