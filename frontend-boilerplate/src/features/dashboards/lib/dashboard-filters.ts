/**
 * Helpers PUROS de filtros do dashboard (T-G1). Sem React — testáveis isolados.
 *
 * Espelham o contrato de LAYOUT (doc 20): cada `Filter` tem { id, type, label,
 * default }; um bloco "escuta" um filtro quando seu `dataBinding.params` referencia
 * o `filterId`. É essa relação que permite recomputar SÓ os blocos afetados quando
 * um filtro muda (a cacheKey por bloco do T-C garante isso no backend; aqui
 * derivamos a relação para UX/teste e para evitar piscar blocos não-afetados).
 *
 * NOTA (gotcha de T-I/T-E): os tipos de `@dashboards/contracts` resolvem para
 * `any` no FE (`json-schema-to-ts` não é dep do FE), então tipamos localmente os
 * elementos que iteramos.
 */

/** Tipos de filtro suportados no MVP (enum do contrato de LAYOUT). */
export type DashFilterType =
  | 'date_range'
  | 'select'
  | 'multiselect'
  | 'search'
  | 'number_range';

/** Filtro do topo (subset tipado localmente do contrato de LAYOUT). */
export interface DashFilter {
  id: string;
  type: DashFilterType;
  label: string;
  default?: unknown;
}

interface BindingParam {
  filterId?: string;
  as?: string;
  [key: string]: unknown;
}
interface BindingLike {
  params?: BindingParam[];
  [key: string]: unknown;
}
interface BlockLike {
  id: string;
  dataBinding?: BindingLike;
  [key: string]: unknown;
}
interface RowLike {
  blocks?: BlockLike[];
  [key: string]: unknown;
}
interface LayoutLike {
  filters?: DashFilter[];
  rows?: RowLike[];
  [key: string]: unknown;
}

/** Mapa de valores de filtro (filterId → valor), enviado no batch `POST .../data`. */
export type FilterValues = Record<string, unknown>;

/**
 * Valores iniciais dos filtros a partir dos seus `default` no layout. Filtros sem
 * `default` ficam de fora (o backend usa o que receber; ausência = sem bind).
 */
export function initialFilterValues(filters: DashFilter[] | undefined): FilterValues {
  const out: FilterValues = {};
  for (const f of filters ?? []) {
    if (f.default !== undefined) out[f.id] = f.default;
  }
  return out;
}

/**
 * IDs dos blocos que ESCUTAM um filtro (têm `dataBinding.params` com aquele
 * `filterId`). São exatamente os blocos que recomputam quando o filtro muda.
 */
export function blocksAffectedByFilter(
  layout: LayoutLike | undefined,
  filterId: string,
): string[] {
  const ids: string[] = [];
  for (const row of layout?.rows ?? []) {
    for (const block of row.blocks ?? []) {
      const params = block.dataBinding?.params ?? [];
      if (params.some((p) => p.filterId === filterId)) ids.push(block.id);
    }
  }
  return ids;
}

/** Indica se o filtro afeta ao menos um bloco do layout. */
export function isFilterUsed(layout: LayoutLike | undefined, filterId: string): boolean {
  return blocksAffectedByFilter(layout, filterId).length > 0;
}

// =============================================================================
// Resolução do LAYOUT EFETIVO por modo (T-G1 bugfix do DashboardView)
// =============================================================================

import type { ApiMode } from '@/shared/lib/query-keys';
import type { DashboardDetail } from '../types';

/**
 * Extrai o layout efetivo de um `DashboardDetail` no modo pedido. Devolve o
 * `layout` do modo (`draft` | `published`) ou cai pro `draftLayout` quando o
 * modo pedido não tem conteúdo. Função PURA — útil pra testes e pra evitar
 * acoplamento com o `resolveLayout` do backend.
 *
 * Usado pelo `DashboardView` após o bugfix T-G1 (single-query com `mode=draft`
 * + decisão LOCAL via `data.status`). Sem remontar o componente (ver
 * `DashboardView`).
 */
export function pickEffectiveLayout(
  detail: DashboardDetail,
  mode: ApiMode,
): { mode: ApiMode; layout: DashboardDetail['layout'] } {
  if (mode === 'published' && detail.publishedLayout) {
    return { mode, layout: detail.publishedLayout };
  }
  // modo published sem publishedLayout OU mode=draft → usa o draft.
  return { mode: 'draft', layout: detail.draftLayout };
}
