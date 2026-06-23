/**
 * Resolução dos blocos de um layout em vínculos de dados executáveis, COM
 * REVALIDAÇÃO DE VISIBILIDADE (nota de segurança do review T-B3).
 *
 * Um bloco pode obter dados de duas formas:
 *   1. `block.dataBinding` direto no layout; ou
 *   2. `block.props.chartId` → o vínculo vive no Chart referenciado
 *      (publishedDataBinding no modo published, draftDataBinding no draft).
 *
 * Para CADA referência por id (chartId e connectionId) revalidamos que o ATOR
 * pode VER o artefato (visibilidade) — não basta existir. Assim um bloco não
 * consegue, referenciando por id, hidratar dados de um chart/connection que o
 * ator não enxergaria. Falha de visibilidade NÃO executa: o bloco vira `error`.
 *
 * Blocos narrativos (sem dataBinding e sem chartId — ex.: title/rich_text) são
 * ignorados (não produzem resultado de dados).
 */
import { canViewArtifact, type VisibilityArtifact } from '@/lib/visibility';
import type { ActorContext } from '@/lib/rbac';
import type { CatalogDataShape } from '@/lib/catalog';
import type { DataBindingParam } from './cache';
import type { DataMode, ResolvedBlock } from './types';

/** Subset de Chart necessário à resolução/visibilidade. */
export interface ChartLike extends VisibilityArtifact {
  catalogType: string;
  publishedDataBinding?: unknown;
  draftDataBinding?: unknown;
}

/** Subset de Connection necessário à visibilidade (+ o registro completo p/ inline). */
export type ConnectionLike = VisibilityArtifact;

export interface ResolveDeps {
  loadChart: (id: string) => Promise<ChartLike | null>;
  loadConnection: (id: string) => Promise<ConnectionLike | null>;
  resolveShape: (type: string) => CatalogDataShape | null;
}

interface RawBinding {
  connectionId?: unknown;
  query?: unknown;
  params?: unknown;
  transform?: unknown;
  ttlSeconds?: unknown;
}

interface RawBlock {
  id?: unknown;
  type?: unknown;
  props?: { chartId?: unknown } & Record<string, unknown>;
  dataBinding?: RawBinding;
  /** COMPOSIÇÃO RECURSIVA: children (containers como `section`). */
  blocks?: RawBlock[];
}

interface RawLayout {
  rows?: { blocks?: RawBlock[] }[];
}

/** Normaliza um binding cru do JSON do layout/chart em vínculo tipado, ou `null`. */
function normalizeBinding(raw: unknown): ResolvedBlock['binding'] | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as RawBinding;
  if (typeof b.connectionId !== 'string' || typeof b.query !== 'string') return null;
  const params = Array.isArray(b.params)
    ? (b.params.filter(
        (p): p is DataBindingParam =>
          !!p &&
          typeof p === 'object' &&
          typeof (p as DataBindingParam).filterId === 'string' &&
          typeof (p as DataBindingParam).as === 'string',
      ) as DataBindingParam[])
    : undefined;
  return {
    connectionId: b.connectionId,
    query: b.query,
    params,
    transform: b.transform,
    ttlSeconds: typeof b.ttlSeconds === 'number' ? b.ttlSeconds : undefined,
  };
}

/**
 * Resolve todos os blocos com dados de um layout. Retorna um `ResolvedBlock` por
 * bloco que tenha dados (direto ou via chart); blocos narrativos são omitidos.
 *
 * Suporta COMPOSIÇÃO RECURSIVA: blocos-container (ex.: `section`) têm `blocks`
 * (children) que também podem ter dataBinding/chartId. A árvore inteira é
 * percorrida em profundidade (DFS).
 */
export async function resolveBlocks(
  layout: unknown,
  mode: DataMode,
  ctx: ActorContext,
  deps: ResolveDeps,
): Promise<ResolvedBlock[]> {
  const rows = (layout as RawLayout)?.rows ?? [];
  const out: ResolvedBlock[] = [];

  for (const row of rows) {
    for (const block of row.blocks ?? []) {
      await processBlock(block, mode, ctx, deps, out);
    }
  }

  return out;
}

/**
 * Processa UM bloco: resolve seu binding (se tiver) e, se for container
 * (`block.blocks`), desce recursivamente nos children.
 */
async function processBlock(
  block: RawBlock,
  mode: DataMode,
  ctx: ActorContext,
  deps: ResolveDeps,
  out: ResolvedBlock[],
): Promise<void> {
  if (typeof block.id !== 'string') {
    // Mesmo sem id, se for container, desce nos children (best-effort).
    for (const child of block.blocks ?? []) {
      await processBlock(child, mode, ctx, deps, out);
    }
    return;
  }

  const blockId = block.id;
  const chartId =
    block.props && typeof block.props.chartId === 'string'
      ? block.props.chartId
      : undefined;

  let binding = normalizeBinding(block.dataBinding);
  let type = typeof block.type === 'string' ? block.type : '';

  // (2) vínculo via chart referenciado
  if (!binding && chartId) {
    const chart = await deps.loadChart(chartId);
    if (!chart || !canViewArtifact(chart, ctx)) {
      out.push(errorBlock(blockId, type, 'forbidden_chart', 'referenced chart not accessible'));
    } else {
      type = chart.catalogType;
      const chartBinding =
        mode === 'published' ? chart.publishedDataBinding : chart.draftDataBinding;
      binding = normalizeBinding(chartBinding);
      if (!binding) {
        out.push(
          errorBlock(blockId, type, 'no_binding', `chart has no ${mode} data binding`),
        );
      }
    }
  }

  // Tem binding válido → revalida visibilidade da CONNECTION e coleta
  if (binding) {
    const conn = await deps.loadConnection(binding.connectionId);
    if (!conn || !canViewArtifact(conn, ctx)) {
      out.push(
        errorBlock(blockId, type, 'forbidden_connection', 'referenced connection not accessible'),
      );
    } else {
      out.push({
        blockId,
        type,
        shape: type ? deps.resolveShape(type) : null,
        binding,
        connectionRecord: conn,
      });
    }
  }

  // COMPOSIÇÃO RECURSIVA: desce nos children (containers como `section`)
  for (const child of block.blocks ?? []) {
    await processBlock(child, mode, ctx, deps, out);
  }
}

function errorBlock(
  blockId: string,
  type: string,
  code: string,
  message: string,
): ResolvedBlock {
  return { blockId, type, shape: null, binding: null, error: { code, message } };
}
