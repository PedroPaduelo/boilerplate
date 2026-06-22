/**
 * Operações PURAS de edição do LAYOUT de um dashboard (T-G2). Sem React —
 * 100% testáveis isoladas. Todas retornam um NOVO layout (imutável); nunca
 * mutam o argumento.
 *
 * O editor humano do MVP é ENXUTO e SEM drag-and-drop (decisão do usuário):
 * reordenar/mover/remover blocos, ajustar span, editar blocos narrativos
 * (title/rich_text), ajustar filtros e o `dataBinding` de um bloco. O grosso do
 * layout é montado pelo agente (T-H) — aqui é o ajuste fino + publish.
 *
 * Fonte da verdade do formato: `@dashboards/contracts` (doc 20). Antes de salvar
 * (PATCH /dashboards/:id) o layout é validado contra o contrato via
 * `validateLayoutForSave` para dar feedback claro de erro ANTES de bater na API.
 *
 * NOTA (gotcha T-I/T-E): os tipos de `@dashboards/contracts` resolvem para `any`
 * no FE (`json-schema-to-ts` não é dep do FE), então tipamos localmente os
 * elementos do layout (subset fiel ao contrato).
 */
import { validateDashboardLayout, formatErrors } from '@dashboards/contracts';
import type { DashFilter, DashFilterType } from './dashboard-filters';

export type { DashFilter, DashFilterType };

/** Parâmetro de binding (contrato: requer filterId E as). */
export interface EditorBindingParam {
  filterId: string;
  as: string;
}

/** dataBinding de um bloco de dados (contrato: requer connectionId E query). */
export interface EditorDataBinding {
  connectionId: string;
  query: string;
  params?: EditorBindingParam[];
  transform?: unknown;
  ttlSeconds?: number;
}

export interface EditorBlock {
  id: string;
  type: string;
  span: number;
  props?: Record<string, unknown>;
  dataBinding?: EditorDataBinding;
}

export interface EditorRow {
  id: string;
  title?: string;
  blocks: EditorBlock[];
}

export interface EditorLayout {
  filters: DashFilter[];
  rows: EditorRow[];
}

export type MoveDirection = 'up' | 'down';

/* --------------------------------------------------------------- ids ------ */

let idCounter = 0;
/** Gera um id estável-o-suficiente para itens novos criados no editor. */
export function genId(prefix: string): string {
  idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${rand}`;
}

/* ---------------------------------------------------- normalização -------- */

interface RawBlock {
  id?: unknown;
  /** Forma legada de alguns seeds (usa `blockId` no lugar de `id`). */
  blockId?: unknown;
  type?: unknown;
  span?: unknown;
  props?: unknown;
  /** Forma legada: `chartId` no topo do bloco (o contrato espera em `props.chartId`). */
  chartId?: unknown;
  dataBinding?: unknown;
}
interface RawRow {
  id?: unknown;
  title?: unknown;
  blocks?: unknown;
}

function normalizeBinding(raw: unknown): EditorDataBinding | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const b = raw as Record<string, unknown>;
  const params = Array.isArray(b.params)
    ? (b.params as Record<string, unknown>[]).map((p) => ({
        filterId: typeof p.filterId === 'string' ? p.filterId : '',
        as: typeof p.as === 'string' ? p.as : '',
      }))
    : undefined;
  return {
    connectionId: typeof b.connectionId === 'string' ? b.connectionId : '',
    query: typeof b.query === 'string' ? b.query : '',
    ...(params && params.length > 0 ? { params } : {}),
    ...(b.transform !== undefined ? { transform: b.transform } : {}),
    ...(typeof b.ttlSeconds === 'number' ? { ttlSeconds: b.ttlSeconds } : {}),
  };
}

function normalizeBlock(raw: RawBlock): EditorBlock {
  const span = typeof raw.span === 'number' ? raw.span : 12;
  const id =
    typeof raw.id === 'string'
      ? raw.id
      : typeof raw.blockId === 'string'
        ? raw.blockId
        : genId('blk');
  // Preserva a referência ao chart: o contrato a espera em `props.chartId` (forma
  // que o backend lê em collectChartRefs); seeds legados a põem no topo do bloco.
  const props: Record<string, unknown> = {
    ...(raw.props && typeof raw.props === 'object' ? (raw.props as Record<string, unknown>) : {}),
  };
  if (typeof raw.chartId === 'string' && props.chartId === undefined) {
    props.chartId = raw.chartId;
  }
  return {
    id,
    type: typeof raw.type === 'string' ? raw.type : 'title',
    span: clampSpan(span),
    ...(Object.keys(props).length > 0 ? { props } : {}),
    ...(raw.dataBinding ? { dataBinding: normalizeBinding(raw.dataBinding) } : {}),
  };
}

/**
 * Normaliza um layout cru (vindo da API / `any` do contrato) para a forma
 * editável `EditorLayout`, garantindo arrays e clamps. Idempotente.
 */
export function normalizeLayout(raw: unknown): EditorLayout {
  const l = (raw && typeof raw === 'object' ? raw : {}) as {
    filters?: unknown;
    rows?: unknown;
  };
  const filters: DashFilter[] = Array.isArray(l.filters)
    ? (l.filters as Record<string, unknown>[]).map((f) => ({
        id: typeof f.id === 'string' ? f.id : genId('filter'),
        type: (typeof f.type === 'string' ? f.type : 'select') as DashFilterType,
        label: typeof f.label === 'string' ? f.label : '',
        ...(f.default !== undefined ? { default: f.default } : {}),
      }))
    : [];
  const rows: EditorRow[] = Array.isArray(l.rows)
    ? (l.rows as RawRow[]).map((r) => ({
        id: typeof r.id === 'string' ? r.id : genId('row'),
        ...(typeof r.title === 'string' ? { title: r.title } : {}),
        blocks: Array.isArray(r.blocks) ? (r.blocks as RawBlock[]).map(normalizeBlock) : [],
      }))
    : [];
  return { filters, rows };
}

/* ------------------------------------------------------- helpers ---------- */

export function clampSpan(span: number): number {
  if (!Number.isFinite(span)) return 12;
  return Math.max(1, Math.min(12, Math.round(span)));
}

export interface BlockLocation {
  rowIndex: number;
  blockIndex: number;
  row: EditorRow;
  block: EditorBlock;
}

/** Localiza um bloco (e sua row) no layout. `null` se não encontrado. */
export function findBlock(layout: EditorLayout, blockId: string): BlockLocation | null {
  for (let rowIndex = 0; rowIndex < layout.rows.length; rowIndex += 1) {
    const row = layout.rows[rowIndex];
    const blockIndex = row.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex >= 0) {
      return { rowIndex, blockIndex, row, block: row.blocks[blockIndex] };
    }
  }
  return null;
}

/** Mapeia os blocos de uma row (por id) preservando as demais. */
function mapRow(
  layout: EditorLayout,
  rowId: string,
  fn: (row: EditorRow) => EditorRow,
): EditorLayout {
  return {
    ...layout,
    rows: layout.rows.map((row) => (row.id === rowId ? fn(row) : row)),
  };
}

/* --------------------------------------------------- mutações de bloco ---- */

/** Reordena um bloco DENTRO da sua row (mover ↑/↓). No-op nas bordas. */
export function moveBlockWithinRow(
  layout: EditorLayout,
  rowId: string,
  blockId: string,
  direction: MoveDirection,
): EditorLayout {
  return mapRow(layout, rowId, (row) => {
    const idx = row.blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return row;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= row.blocks.length) return row;
    const blocks = [...row.blocks];
    [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
    return { ...row, blocks };
  });
}

/** id da row adjacente (acima/abaixo), ou `null` se não houver. */
export function adjacentRowId(
  layout: EditorLayout,
  rowId: string,
  direction: MoveDirection,
): string | null {
  const idx = layout.rows.findIndex((r) => r.id === rowId);
  if (idx < 0) return null;
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (target < 0 || target >= layout.rows.length) return null;
  return layout.rows[target].id;
}

/** Move um bloco para outra row (ENTRE rows). `position` default = fim da row destino. */
export function moveBlockToRow(
  layout: EditorLayout,
  blockId: string,
  targetRowId: string,
  position?: number,
): EditorLayout {
  const loc = findBlock(layout, blockId);
  if (!loc || loc.row.id === targetRowId) return layout;
  const block = loc.block;

  const rows = layout.rows.map((row) => {
    if (row.id === loc.row.id) {
      return { ...row, blocks: row.blocks.filter((b) => b.id !== blockId) };
    }
    if (row.id === targetRowId) {
      const blocks = [...row.blocks];
      const at = position === undefined ? blocks.length : Math.max(0, Math.min(position, blocks.length));
      blocks.splice(at, 0, block);
      return { ...row, blocks };
    }
    return row;
  });
  return { ...layout, rows };
}

/** Move um bloco para a row adjacente (acima/abaixo). No-op nas bordas. */
export function moveBlockToAdjacentRow(
  layout: EditorLayout,
  blockId: string,
  direction: MoveDirection,
): EditorLayout {
  const loc = findBlock(layout, blockId);
  if (!loc) return layout;
  const targetId = adjacentRowId(layout, loc.row.id, direction);
  if (!targetId) return layout;
  return moveBlockToRow(layout, blockId, targetId);
}

/** Remove um bloco do layout (de qualquer row). */
export function removeBlock(layout: EditorLayout, blockId: string): EditorLayout {
  return {
    ...layout,
    rows: layout.rows.map((row) => ({
      ...row,
      blocks: row.blocks.filter((b) => b.id !== blockId),
    })),
  };
}

/** Ajusta a largura (span 1..12) de um bloco. */
export function setBlockSpan(
  layout: EditorLayout,
  blockId: string,
  span: number,
): EditorLayout {
  return patchBlock(layout, blockId, (block) => ({ ...block, span: clampSpan(span) }));
}

/** Substitui as `props` de um bloco (usado pelos editores narrativos). */
export function setBlockProps(
  layout: EditorLayout,
  blockId: string,
  props: Record<string, unknown>,
): EditorLayout {
  return patchBlock(layout, blockId, (block) => ({ ...block, props }));
}

/** Mescla parcialmente as `props` de um bloco. */
export function updateBlockProps(
  layout: EditorLayout,
  blockId: string,
  patch: Record<string, unknown>,
): EditorLayout {
  return patchBlock(layout, blockId, (block) => ({
    ...block,
    props: { ...(block.props ?? {}), ...patch },
  }));
}

/** Define (ou remove, passando `undefined`) o `dataBinding` de um bloco. */
export function setBlockDataBinding(
  layout: EditorLayout,
  blockId: string,
  binding: EditorDataBinding | undefined,
): EditorLayout {
  return patchBlock(layout, blockId, (block) => {
    const next: EditorBlock = { ...block };
    if (binding === undefined) delete next.dataBinding;
    else next.dataBinding = binding;
    return next;
  });
}

function patchBlock(
  layout: EditorLayout,
  blockId: string,
  fn: (block: EditorBlock) => EditorBlock,
): EditorLayout {
  return {
    ...layout,
    rows: layout.rows.map((row) => ({
      ...row,
      blocks: row.blocks.map((block) => (block.id === blockId ? fn(block) : block)),
    })),
  };
}

/* ----------------------------------------------------- mutações de row ---- */

/** Acrescenta uma row vazia ao final. */
export function addRow(layout: EditorLayout, title?: string): EditorLayout {
  const row: EditorRow = { id: genId('row'), blocks: [], ...(title ? { title } : {}) };
  return { ...layout, rows: [...layout.rows, row] };
}

/** Remove uma row inteira (e seus blocos). */
export function removeRow(layout: EditorLayout, rowId: string): EditorLayout {
  return { ...layout, rows: layout.rows.filter((r) => r.id !== rowId) };
}

/** Edita o título de uma row (vazio → remove o título). */
export function setRowTitle(
  layout: EditorLayout,
  rowId: string,
  title: string,
): EditorLayout {
  return mapRow(layout, rowId, (row) => {
    const next = { ...row };
    if (title.trim() === '') delete next.title;
    else next.title = title;
    return next;
  });
}

/* -------------------------------------------------- mutações de filtro ---- */

/** Adiciona um filtro novo (com defaults sensatos). */
export function addFilter(layout: EditorLayout, filter?: Partial<DashFilter>): EditorLayout {
  const f: DashFilter = {
    id: filter?.id ?? genId('filter'),
    type: filter?.type ?? 'select',
    label: filter?.label ?? 'Novo filtro',
    ...(filter?.default !== undefined ? { default: filter.default } : {}),
  };
  return { ...layout, filters: [...layout.filters, f] };
}

/** Remove um filtro pelo id. */
export function removeFilter(layout: EditorLayout, filterId: string): EditorLayout {
  return { ...layout, filters: layout.filters.filter((f) => f.id !== filterId) };
}

/** Edita parcialmente um filtro (id/label/type/default). */
export function updateFilter(
  layout: EditorLayout,
  filterId: string,
  patch: Partial<DashFilter>,
): EditorLayout {
  return {
    ...layout,
    filters: layout.filters.map((f) => (f.id === filterId ? { ...f, ...patch } : f)),
  };
}

/* -------------------------------------------------- save / validação ------ */

/**
 * Constrói o objeto de layout LIMPO para enviar à API — fiel ao contrato
 * (`additionalProperties: false`): só inclui as chaves opcionais quando têm
 * valor. Mantém connectionId/query/params como o usuário digitou (mesmo vazios)
 * para que a validação do contrato APONTE o problema (ex.: connectionId vazio →
 * minLength). Ordem de chaves determinística (estável p/ comparação de dirty).
 */
export function sanitizeLayoutForSave(layout: EditorLayout): {
  filters: unknown[];
  rows: unknown[];
} {
  const filters = layout.filters.map((f) => ({
    id: f.id,
    type: f.type,
    label: f.label,
    ...(f.default !== undefined ? { default: f.default } : {}),
  }));

  const rows = layout.rows.map((row) => ({
    id: row.id,
    ...(row.title !== undefined && row.title !== '' ? { title: row.title } : {}),
    blocks: row.blocks.map((block) => {
      const out: Record<string, unknown> = {
        id: block.id,
        type: block.type,
        span: block.span,
      };
      if (block.props && Object.keys(block.props).length > 0) out.props = block.props;
      if (block.dataBinding) out.dataBinding = sanitizeBinding(block.dataBinding);
      return out;
    }),
  }));

  return { filters, rows };
}

function sanitizeBinding(binding: EditorDataBinding): Record<string, unknown> {
  const out: Record<string, unknown> = {
    connectionId: binding.connectionId,
    query: binding.query,
  };
  if (binding.params && binding.params.length > 0) {
    out.params = binding.params.map((p) => ({ filterId: p.filterId, as: p.as }));
  }
  if (binding.transform !== undefined && binding.transform !== '') {
    out.transform = binding.transform;
  }
  if (binding.ttlSeconds !== undefined) out.ttlSeconds = binding.ttlSeconds;
  return out;
}

export interface LayoutValidationResult {
  valid: boolean;
  /** Layout limpo pronto para o PATCH (`{ filters, rows }`). */
  payload: { filters: unknown[]; rows: unknown[] };
  /** Mensagem de erro legível (do ajv) quando inválido. */
  error?: string;
}

/**
 * Valida o layout editado contra o CONTRATO COMPARTILHADO (doc 20) ANTES de
 * salvar — feedback de erro rápido e claro, sem round-trip à API. Espelha o
 * `assertValidLayout` do backend (mesma função `validateDashboardLayout`).
 */
export function validateLayoutForSave(layout: EditorLayout): LayoutValidationResult {
  const payload = sanitizeLayoutForSave(layout);
  const valid = validateDashboardLayout(payload) as boolean;
  return {
    valid,
    payload,
    ...(valid ? {} : { error: formatErrors(validateDashboardLayout.errors) }),
  };
}

/** Compara dois layouts pela forma canônica (sanitizada) — usado p/ dirty-state. */
export function layoutsEqual(a: EditorLayout, b: EditorLayout): boolean {
  return JSON.stringify(sanitizeLayoutForSave(a)) === JSON.stringify(sanitizeLayoutForSave(b));
}
