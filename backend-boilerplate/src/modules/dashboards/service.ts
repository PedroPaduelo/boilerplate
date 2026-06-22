/**
 * Regra de negócio do módulo `dashboards` (T-B3).
 *
 * Dashboard = artefato com LAYOUT (`{ filters, rows }`, doc 20) no modelo
 * draft/published SEM histórico (doc 08):
 *   - `publish`   copia `draftLayout` → `publishedLayout`, seta `publishedAt`,
 *     `status=PUBLISHED` e INVALIDA o cache de layout no Redis (`dash:{id}:published`).
 *   - `unpublish` zera `publishedLayout` (Prisma.DbNull), volta `status=DRAFT` e
 *     também invalida o cache.
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
  type DashboardLayout,
} from '@dashboards/contracts';
import { Prisma, type Dashboard } from '@prisma/client';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/http/routes/_errors';
import { prisma } from '@/lib/prisma';
import type { ActorContext } from '@/lib/rbac';
import { redisService } from '@/lib/redis';
import { canModifyArtifact, canViewArtifact } from '@/lib/visibility';
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

/** Copia draftLayout→publishedLayout, seta publishedAt/status e invalida o cache. */
export async function publishDashboard(dashboard: Dashboard): Promise<Dashboard> {
  // garante que o draft atual é um layout válido antes de promover.
  assertValidLayout(dashboard.draftLayout);
  const updated = await prisma.dashboard.update({
    where: { id: dashboard.id },
    data: {
      publishedLayout: dashboard.draftLayout as Prisma.InputJsonValue,
      publishedAt: new Date(),
      status: 'PUBLISHED',
    },
  });
  await invalidatePublishedLayoutCache(dashboard.id);
  return updated;
}

/** Zera publishedLayout (DbNull), volta status=DRAFT e invalida o cache. */
export async function unpublishDashboard(id: string): Promise<Dashboard> {
  const updated = await prisma.dashboard.update({
    where: { id },
    data: {
      publishedLayout: Prisma.DbNull,
      publishedAt: null,
      status: 'DRAFT',
    },
  });
  await invalidatePublishedLayoutCache(id);
  return updated;
}
