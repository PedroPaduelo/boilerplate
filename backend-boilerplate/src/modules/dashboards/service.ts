/**
 * Regra de negócio do módulo `dashboards` (T-B3).
 *
 * Dashboard = artefato com LAYOUT (`{ filters, rows }`, doc 20) no modelo
 * draft/published SEM histórico (doc 08):
 *   - `publish`   copia `draftLayout` → `publishedLayout`, MATERIALIZA um
 *     SNAPSHOT dos dados de cada bloco (executa o `dataBinding` via o core
 *     `executeBlockData` do T-C, mesmo caminho inline do batch draft) e
 *     armazena o resultado no campo `publishedDataPayload`. Seta
 *     `publishedAt`+`status=PUBLISHED` e invalida o cache de layout.
 *   - `unpublish` zera `publishedLayout` E `publishedDataPayload`
 *     (Prisma.DbNull), volta `status=DRAFT` e invalida o cache.
 *
 * Validações de domínio:
 *   - TODO `draftLayout` (create/update/add-chart) é validado contra o CONTRATO
 *     COMPARTILHADO `@dashboards/contracts` (`validateDashboardLayout`, doc 20).
 *     Layout inválido → BadRequestError (400) com a mensagem do ajv.
 *   - Blocos que referenciam um Chart (via `props.chartId`) DEVEM apontar para um
 *     Chart existente — validado em create/update e na operação add_chart.
 *   - visibilidade DEPARTMENT exige `departmentId` (e o ator deve ser membro,
 *     salvo ADMIN).
 *
 * RBAC/ownership/visibilidade reutilizam os helpers COMPARTILHADOS da T-B1
 * (`@/lib/rbac` + `@/lib/visibility`) — este módulo NÃO reimplementa RBAC.
 */
import {
  formatErrors,
  validateDashboardLayout,
  type BlockDataResult,
  type DashboardLayout,
} from '@dashboards/contracts';
import { Prisma, type Dashboard } from '@prisma/client';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/http/routes/_errors';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { mapWithConcurrency } from '@/lib/concurrency';
import { runQuery } from '@/lib/pg-runner';
import type { ActorContext } from '@/lib/rbac';
import { redisService } from '@/lib/redis';
import { canModifyArtifact, canViewArtifact } from '@/lib/visibility';
import { resolveBlocks } from '@/modules/data/block-resolver';
import { resolveParamsValues } from '@/modules/data/cache';
import { toPgRunnerConnection } from '@/modules/data/connection-loader';
import { executeBlockData } from '@/modules/data/executor';
import { getCatalogDataShape } from '@/lib/catalog';
import type { AddChartInput, CreateDashboardInput, UpdateDashboardInput } from './schema';

/**
 * Estruturas de trabalho mutáveis para manipular o layout (ex.: add_chart). O
 * conteúdo é sempre validado contra o CONTRATO (`assertValidLayout`) antes/depois
 * de mutar — estes tipos são apenas para satisfazer o `noImplicitAny`.
 */
interface BlockShape {
  id: string;
  type: string;
  span?: number;
  props?: Record<string, unknown>;
  [key: string]: unknown;
}
interface RowShape {
  id: string;
  title?: string;
  blocks: BlockShape[];
  [key: string]: unknown;
}
interface LayoutShape {
  filters: unknown[];
  rows: RowShape[];
}

/** Chave Redis do cache de LAYOUT publicado de um dashboard (doc 20). */
export function publishedLayoutCacheKey(dashboardId: string): string {
  return `dash:${dashboardId}:published`;
}

/**
 * Valida o layout contra o contrato compartilhado (doc 20). Lança
 * BadRequestError com a mensagem do ajv quando inválido. Retorna o layout
 * tipado para uso posterior.
 */
export function assertValidLayout(layout: unknown): DashboardLayout {
  if (!validateDashboardLayout(layout)) {
    throw new BadRequestError(
      `Invalid dashboard layout: ${formatErrors(validateDashboardLayout.errors)}`,
    );
  }
  return layout as DashboardLayout;
}

/** Extrai todos os `chartId` referenciados por blocos do layout (via `props.chartId`). */
export function collectChartRefs(layout: DashboardLayout): string[] {
  const ids = new Set<string>();
  for (const row of layout.rows ?? []) {
    for (const block of row.blocks ?? []) {
      const props = (block as { props?: Record<string, unknown> }).props;
      const chartId = props?.chartId;
      if (typeof chartId === 'string' && chartId.length > 0) ids.add(chartId);
    }
  }
  return [...ids];
}

// =============================================================================
// Enriquecimento do layout com o TÍTULO do chart referenciado
// =============================================================================
//
// PROBLEMA: o render-engine do FE desenha o header de cada bloco-gráfico com
// `block.title ?? def.manifest.name`. Como o layout salvo NÃO carrega o título
// do Chart (ele referencia só o `props.chartId`), o header caía no NOME GENÉRICO
// do tipo de bloco ("Barras Horizontais", "Donut", "Tabela Rica") em vez do
// título real do chart ("N1 — Momento Lançamento", etc.).
//
// SOLUÇÃO: ao servir o layout (GET /dashboards/:id), preenchemos `block.title`
// com o título do Chart referenciado QUANDO ele estiver ausente — sem tocar o
// contrato nem o dado salvo. Um `block.title` explícito (definido pelo autor)
// SEMPRE vence. Percorre a árvore recursivamente (containers `block.blocks`).

/** Coleta chartIds de um layout cru, descendo recursivamente em containers. */
function collectChartRefsDeep(layout: unknown): string[] {
  const ids = new Set<string>();
  const visitBlock = (block: unknown): void => {
    if (!block || typeof block !== 'object') return;
    const b = block as { props?: { chartId?: unknown }; blocks?: unknown };
    const chartId = b.props?.chartId;
    if (typeof chartId === 'string' && chartId.length > 0) ids.add(chartId);
    const children = Array.isArray(b.blocks) ? b.blocks : [];
    for (const child of children) visitBlock(child);
  };
  const rows = Array.isArray((layout as { rows?: unknown }).rows)
    ? ((layout as { rows: unknown[] }).rows)
    : [];
  for (const row of rows) {
    const blocks = Array.isArray((row as { blocks?: unknown }).blocks)
      ? ((row as { blocks: unknown[] }).blocks)
      : [];
    for (const block of blocks) visitBlock(block);
  }
  return [...ids];
}

/**
 * Devolve uma CÓPIA do layout com `block.title` preenchido a partir do
 * `titleById` (chartId → título) para os blocos que referenciam um chart e
 * ainda não têm título. Recursivo. Layouts nulos/inválidos são retornados como
 * estão (defensivo — não quebra o serve).
 */
function injectChartTitles(layout: unknown, titleById: Map<string, string>): unknown {
  if (!layout || typeof layout !== 'object') return layout;

  const enrichBlock = (block: unknown): unknown => {
    if (!block || typeof block !== 'object') return block;
    const b = block as Record<string, unknown> & {
      props?: { chartId?: unknown };
      blocks?: unknown;
      title?: unknown;
    };
    let next: Record<string, unknown> = b;

    const chartId = b.props?.chartId;
    const hasTitle = typeof b.title === 'string' && b.title.trim().length > 0;
    if (typeof chartId === 'string' && !hasTitle) {
      const title = titleById.get(chartId);
      if (title) next = { ...next, title };
    }

    if (Array.isArray((next as { blocks?: unknown }).blocks)) {
      next = {
        ...next,
        blocks: ((next as { blocks: unknown[] }).blocks).map(enrichBlock),
      };
    }
    return next;
  };

  const l = layout as { rows?: unknown };
  const rows = Array.isArray(l.rows) ? l.rows : [];
  return {
    ...(layout as Record<string, unknown>),
    rows: rows.map((row) => {
      if (!row || typeof row !== 'object') return row;
      const r = row as Record<string, unknown> & { blocks?: unknown };
      const blocks = Array.isArray(r.blocks) ? r.blocks : [];
      return { ...r, blocks: blocks.map(enrichBlock) };
    }),
  };
}

/**
 * Enriquece UM OU MAIS layouts (ex.: o resolvido + draftLayout + publishedLayout
 * de uma mesma resposta) com o título do Chart referenciado, fazendo UMA ÚNICA
 * busca no banco para todos os chartIds. Mantém a ordem da entrada.
 */
export async function enrichLayoutsChartTitles(layouts: unknown[]): Promise<unknown[]> {
  const ids = new Set<string>();
  for (const layout of layouts) {
    for (const id of collectChartRefsDeep(layout)) ids.add(id);
  }
  if (ids.size === 0) return layouts;

  const charts = await prisma.chart.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, title: true },
  });
  if (charts.length === 0) return layouts;

  const titleById = new Map(charts.map((c) => [c.id, c.title]));
  return layouts.map((layout) => injectChartTitles(layout, titleById));
}

/** Garante que TODOS os `chartId` referenciados pelo layout existem. */
export async function assertChartRefsExist(layout: DashboardLayout): Promise<void> {
  const ids = collectChartRefs(layout);
  if (ids.length === 0) return;
  const found = await prisma.chart.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const foundIds = new Set(found.map((c) => c.id));
  const missing = ids.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new BadRequestError(
      `layout references unknown chartId(s): ${missing.join(', ')}`,
    );
  }
}

/** Valida coerência de visibilidade × departamento (e membership do ator). */
async function assertDepartmentAccess(
  ctx: ActorContext,
  visibility: string,
  departmentId: string | null,
): Promise<void> {
  if (visibility === 'DEPARTMENT' && !departmentId) {
    throw new BadRequestError('departmentId is required when visibility is DEPARTMENT');
  }
  if (departmentId) {
    const dep = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });
    if (!dep) throw new BadRequestError('department not found');
    if (ctx.role !== 'ADMIN' && !ctx.departmentIds.includes(departmentId)) {
      throw new ForbiddenError('You are not a member of this department');
    }
  }
}

/** Invalida (best-effort) o cache de layout publicado de um dashboard. */
export async function invalidatePublishedLayoutCache(dashboardId: string): Promise<void> {
  if (!redisService.isReady()) return;
  try {
    await redisService.deleteKey(publishedLayoutCacheKey(dashboardId));
  } catch {
    // cache é best-effort — falha não deve quebrar a operação.
  }
}

export async function createDashboard(
  ctx: ActorContext,
  input: CreateDashboardInput,
): Promise<Dashboard> {
  const departmentId = input.departmentId ?? null;
  await assertDepartmentAccess(ctx, input.visibility, departmentId);
  const layout = assertValidLayout(input.draftLayout);
  await assertChartRefsExist(layout);

  return prisma.dashboard.create({
    data: {
      title: input.title,
      draftLayout: input.draftLayout as unknown as Prisma.InputJsonValue,
      ownerId: ctx.userId,
      departmentId,
      visibility: input.visibility,
      // status defaulta para DRAFT; publishedLayout permanece null até o 1º publish.
    },
  });
}

export interface ListDashboardsParams {
  where: Record<string, unknown>;
  page: number;
  pageSize: number;
}

export async function listDashboards({
  where,
  page,
  pageSize,
}: ListDashboardsParams): Promise<{ dashboards: Dashboard[]; total: number }> {
  const [dashboards, total] = await Promise.all([
    prisma.dashboard.findMany({
      where: where as Prisma.DashboardWhereInput,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dashboard.count({ where: where as Prisma.DashboardWhereInput }),
  ]);
  return { dashboards, total };
}

/** Carrega um dashboard para LEITURA. 404 (não 403) se invisível, p/ não vazar existência. */
export async function requireDashboardForView(
  id: string,
  ctx: ActorContext,
): Promise<Dashboard> {
  const dashboard = await prisma.dashboard.findUnique({ where: { id } });
  if (!dashboard || !canViewArtifact(dashboard, ctx)) {
    throw new NotFoundError('Dashboard not found');
  }
  return dashboard;
}

/** Carrega um dashboard para EDIÇÃO/EXCLUSÃO/PUBLISH. 404 se inexistente; 403 se não dono. */
export async function requireDashboardForModify(
  id: string,
  ctx: ActorContext,
): Promise<Dashboard> {
  const dashboard = await prisma.dashboard.findUnique({ where: { id } });
  if (!dashboard) throw new NotFoundError('Dashboard not found');
  if (!canModifyArtifact(dashboard, ctx)) {
    throw new ForbiddenError('You can only modify dashboards you own');
  }
  return dashboard;
}

export async function updateDashboard(
  ctx: ActorContext,
  existing: Dashboard,
  input: UpdateDashboardInput,
): Promise<Dashboard> {
  const nextVisibility = input.visibility ?? existing.visibility;
  const nextDepartmentId =
    input.departmentId !== undefined ? (input.departmentId ?? null) : existing.departmentId;
  await assertDepartmentAccess(ctx, nextVisibility, nextDepartmentId);

  if (input.draftLayout !== undefined) {
    const layout = assertValidLayout(input.draftLayout);
    await assertChartRefsExist(layout);
  }

  const data: Prisma.DashboardUncheckedUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.draftLayout !== undefined) {
    data.draftLayout = input.draftLayout as unknown as Prisma.InputJsonValue;
  }
  if (input.visibility !== undefined) data.visibility = input.visibility;
  if (input.departmentId !== undefined) data.departmentId = input.departmentId ?? null;

  // NOTA: editar o draft NUNCA toca o publishedLayout — o publicado só muda num
  // novo `publish`. É o isolamento draft↔published do modelo (doc 08).
  return prisma.dashboard.update({ where: { id: existing.id }, data });
}

export async function deleteDashboard(id: string): Promise<void> {
  await prisma.dashboard.delete({ where: { id } });
}

/**
 * Insere um bloco que referencia um Chart (via `props.chartId`) numa row/posição
 * do `draftLayout` (operação `add_chart_to_dashboard`, doc 20). Valida que o
 * Chart existe e é visível ao ator, e re-valida o layout resultante contra o
 * contrato.
 */
export async function addChartToDashboard(
  ctx: ActorContext,
  existing: Dashboard,
  input: AddChartInput,
): Promise<Dashboard> {
  const chart = await prisma.chart.findUnique({ where: { id: input.chartId } });
  if (!chart || !canViewArtifact(chart, ctx)) {
    throw new NotFoundError(`Chart "${input.chartId}" not found`);
  }

  assertValidLayout(existing.draftLayout);
  // estrutura de trabalho mutável (o conteúdo já passou pelo contrato acima).
  const layout = existing.draftLayout as unknown as LayoutShape;
  const rows: RowShape[] = layout.rows.map((r) => ({ ...r, blocks: [...r.blocks] }));

  // bloco que referencia o chart: tipo = catalogType do chart, props.chartId.
  const blockId = input.blockId ?? `blk_${chart.id}_${Date.now()}`;
  const newBlock: BlockShape = {
    id: blockId,
    type: chart.catalogType,
    span: input.span,
    props: { ...(input.props ?? {}), chartId: chart.id },
  };

  let targetRow: RowShape | undefined = input.rowId
    ? rows.find((r) => r.id === input.rowId)
    : undefined;
  if (input.rowId && !targetRow) {
    throw new BadRequestError(`row "${input.rowId}" not found in dashboard layout`);
  }
  if (!targetRow) {
    // sem rowId → cria uma nova row ao final.
    targetRow = { id: `row_${Date.now()}`, blocks: [] };
    rows.push(targetRow);
  }

  const blocks = targetRow.blocks;
  const at =
    input.position !== undefined ? Math.min(input.position, blocks.length) : blocks.length;
  blocks.splice(at, 0, newBlock);

  const nextLayout = { filters: layout.filters, rows };
  // re-valida o layout resultante contra o contrato (defensivo).
  assertValidLayout(nextLayout);

  return prisma.dashboard.update({
    where: { id: existing.id },
    data: { draftLayout: nextLayout as unknown as Prisma.InputJsonValue },
  });
}

/**
 * Resolve o layout para o `mode` pedido. `published` só é retornado quando o
 * dashboard está PUBLISHED (com `publishedLayout`); senão BadRequestError.
 * Default = `draft` (modo de edição).
 */
export function resolveLayout(
  dashboard: Dashboard,
  mode: 'draft' | 'published',
): { mode: 'draft' | 'published'; layout: unknown } {
  if (mode === 'published') {
    if (dashboard.status !== 'PUBLISHED' || dashboard.publishedLayout == null) {
      throw new BadRequestError('Dashboard has no published layout');
    }
    return { mode, layout: dashboard.publishedLayout as unknown };
  }
  return { mode: 'draft', layout: dashboard.draftLayout as unknown };
}

/**
 * Materializa um SNAPSHOT dos dados de todos os blocos com `dataBinding` de um
 * layout (caminho INLINE — sem fila, sem cache, sem socket; reusa o core `executeBlockData`).
 *
 * Por que existe (T-G1 bugfix do share público): a página `/public/:token` é
 * ANÔNIMA — não pode chamar o batch autenticado nem decifrar senha de conexão.
 * Pra ela mostrar blocos com dados (KPI/gráfico/tabela), o publish precisa
 * "cozinhar" o resultado de cada bloco AGORA e guardar no `publishedDataPayload`.
 * Um novo publish regenera (substitui). Erro de execução num bloco vira
 * `state: 'error'` no resultado (a página mostra a mensagem) — não falhamos o
 * publish inteiro, porque o objetivo é manter o link público funcional mesmo
 * se UMA query falhar (defensivo).
 *
 * `ctx` é o do DONO do dashboard (publish exige ownership/permission). A
 * visibilidade de charts/connections referenciados é revalidada contra o dono
 * (não há outro usuário no momento do publish) — quem abrir o link público
 * depois herda esse snapshot já materializado.
 */
export async function materializePublishedDataPayload(
  layout: DashboardLayout,
  ctx: ActorContext,
): Promise<{
  dashboardId: string;
  mode: 'published';
  generatedAt: string;
  blocks: Record<string, BlockDataResult>;
}> {
  const resolved = await resolveBlocks(layout, 'published', ctx, {
    loadChart: (id) =>
      prisma.chart.findUnique({
        where: { id },
        select: {
          ownerId: true,
          visibility: true,
          departmentId: true,
          catalogType: true,
          publishedDataBinding: true,
          draftDataBinding: true,
        },
      }),
    loadConnection: (id) => prisma.connection.findUnique({ where: { id } }),
    resolveShape: (type) => getCatalogDataShape(type),
  });

  // Executa os blocos EM PARALELO com limite de concorrência (= pool do
  // pg-runner) em vez de serial — derruba o tempo total de ~N×Tquery para
  // ~ceil(N/limite)×Tquery. NUNCA dispara mais que o pool (senão jobs
  // excedentes morreriam por connection timeout — mesmo invariante do worker).
  const limit = Math.max(1, Math.min(env.PG_RUNNER_POOL_MAX, resolved.length || 1));
  const entries = await mapWithConcurrency(resolved, limit, async (block) => {
    if (block.error || !block.binding) {
      // bloco sem binding (narrativo) → omitido; com erro de resolução → error.
      return block.error
        ? ([block.blockId, { blockId: block.blockId, state: 'error', error: block.error }] as const)
        : null;
    }
    const conn = block.connectionRecord as
      | Parameters<typeof toPgRunnerConnection>[0]
      | undefined;
    if (!conn) {
      return [
        block.blockId,
        {
          blockId: block.blockId,
          state: 'error',
          error: { code: 'connection_not_found', message: 'connection not resolved' },
        },
      ] as const;
    }
    const paramsValues = resolveParamsValues(block.binding.params, undefined);
    const result = await executeBlockData(
      {
        blockId: block.blockId,
        connection: toPgRunnerConnection(conn),
        sql: block.binding.query,
        paramsValues,
        transform: block.binding.transform,
        shape: block.shape,
        cached: false,
      },
      { runQuery },
    );
    return [block.blockId, result] as const;
  });

  const blocks: Record<string, BlockDataResult> = {};
  for (const entry of entries) {
    if (entry) blocks[entry[0]] = entry[1] as BlockDataResult;
  }

  return {
    dashboardId: '',
    mode: 'published',
    generatedAt: new Date().toISOString(),
    blocks,
  };
}

/**
 * Publica o dashboard: copia draftLayout→publishedLayout, seta
 * `publishedAt`+`status=PUBLISHED` e invalida o cache — e responde NA HORA.
 *
 * O SNAPSHOT de dados (`publishedDataPayload`, que só serve para a página
 * pública anônima `/public/:token`) é materializado em BACKGROUND (paralelo),
 * NÃO bloqueando a resposta do publish. Por quê: materializar inline executava
 * todas as queries do dashboard em série (~N×Tquery), o que estourava o timeout
 * do cliente (MCP/HTTP) em dashboards densos — publish "dava erro" mesmo
 * funcionando. Agora o publish é O(1): promove o layout e dispara o snapshot.
 *
 * O dashboard AUTENTICADO não depende deste snapshot (busca dados pelo
 * batch/worker sob demanda), então o usuário vê tudo imediatamente. O link
 * público herda o snapshot assim que o background termina (segundos depois);
 * até lá, mantém o snapshot da publicação anterior (na 1ª publicação, vazio).
 */
export async function publishDashboard(
  dashboard: Dashboard,
  ctx: ActorContext,
): Promise<Dashboard> {
  // garante que o draft atual é um layout válido antes de promover.
  assertValidLayout(dashboard.draftLayout);

  // Snapshot INICIAL: preserva o da publicação anterior (link público não fica
  // vazio durante a rematerialização); na 1ª publicação, inicializa vazio.
  const initialPayload =
    dashboard.publishedDataPayload != null
      ? (dashboard.publishedDataPayload as Prisma.InputJsonValue)
      : ({
          dashboardId: dashboard.id,
          mode: 'published',
          generatedAt: new Date().toISOString(),
          blocks: {},
        } as unknown as Prisma.InputJsonValue);

  const updated = await prisma.dashboard.update({
    where: { id: dashboard.id },
    data: {
      publishedLayout: dashboard.draftLayout as Prisma.InputJsonValue,
      publishedDataPayload: initialPayload,
      publishedAt: new Date(),
      status: 'PUBLISHED',
    },
  });
  await invalidatePublishedLayoutCache(dashboard.id);

  // Materializa o snapshot em BACKGROUND (fire-and-forget; nunca derruba o
  // processo nem o publish). Atualiza `publishedDataPayload` quando termina.
  void rematerializePublishedSnapshot(
    dashboard.id,
    dashboard.draftLayout as unknown as DashboardLayout,
    ctx,
  );

  return updated;
}

/**
 * Materializa o snapshot do dashboard em segundo plano e grava em
 * `publishedDataPayload`. Tolerante a falhas: erro vira log, não exceção
 * (o publish já respondeu). Exportada para testes que queiram aguardar.
 */
export async function rematerializePublishedSnapshot(
  dashboardId: string,
  layout: DashboardLayout,
  ctx: ActorContext,
): Promise<void> {
  try {
    const payloadDraft = await materializePublishedDataPayload(layout, ctx);
    const payload = { ...payloadDraft, dashboardId };
    await prisma.dashboard.update({
      where: { id: dashboardId },
      data: { publishedDataPayload: payload as unknown as Prisma.InputJsonValue },
    });
  } catch (err) {
    console.error(
      `[dashboards] background snapshot materialize failed for ${dashboardId}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

/** Zera publishedLayout E publishedDataPayload (DbNull), volta status=DRAFT e invalida o cache. */
export async function unpublishDashboard(id: string): Promise<Dashboard> {
  const updated = await prisma.dashboard.update({
    where: { id },
    data: {
      publishedLayout: Prisma.DbNull,
      publishedDataPayload: Prisma.DbNull,
      publishedAt: null,
      status: 'DRAFT',
    },
  });
  await invalidatePublishedLayoutCache(id);
  return updated;
}
