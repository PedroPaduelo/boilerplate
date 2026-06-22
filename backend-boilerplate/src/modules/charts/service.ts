/**
 * Regra de negócio do módulo `charts` (T-B2).
 *
 * CRUD de gráficos reutilizáveis + publish/unpublish no modelo draft/published
 * SEM histórico (docs/plano/08 e 30):
 *   - `publish`   copia `draft*` → `published*`, seta `publishedAt` e `status=PUBLISHED`.
 *   - `unpublish` zera os `published*` e volta `status=DRAFT`.
 *
 * Validações de domínio:
 *   - `catalogType` DEVE existir no catálogo VIVO (`@/lib/catalog`, gerado por
 *     `build:catalog`); `draftProps` é validado contra o `propsSchema` do tipo.
 *   - `draftDataBinding.connectionId` DEVE referenciar uma Connection existente.
 *   - visibilidade DEPARTMENT exige `departmentId` (e o ator deve ser membro,
 *     salvo ADMIN).
 *
 * RBAC/ownership/visibilidade reutilizam os helpers COMPARTILHADOS da T-B1
 * (`@/lib/rbac` + `@/lib/visibility`) — este módulo NÃO reimplementa RBAC.
 */
import { Prisma, type Chart } from '@prisma/client';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/http/routes/_errors';
import { hasCatalogType, validatePropsAgainstCatalog } from '@/lib/catalog';
import { prisma } from '@/lib/prisma';
import type { ActorContext } from '@/lib/rbac';
import { canModifyArtifact, canViewArtifact } from '@/lib/visibility';
import type { CreateChartInput, DataBindingInput, UpdateChartInput } from './schema';

/** Garante que o tipo de bloco existe no catálogo gerado (F0.4). */
function assertValidCatalogType(catalogType: string): void {
  if (!hasCatalogType(catalogType)) {
    throw new BadRequestError(
      `Unknown catalogType "${catalogType}" — not present in the catalog (run build:catalog)`,
    );
  }
}

/** Valida `props` contra o `propsSchema` do tipo (defensivo; não bloqueia sem schema). */
function assertValidProps(catalogType: string, props: unknown): void {
  const { ok, errors } = validatePropsAgainstCatalog(catalogType, props);
  if (!ok) {
    throw new BadRequestError(`Invalid props for catalogType "${catalogType}": ${errors}`);
  }
}

/** Valida a EXISTÊNCIA da conexão referenciada pelo dataBinding. */
async function assertValidDataBinding(binding: DataBindingInput): Promise<void> {
  const conn = await prisma.connection.findUnique({
    where: { id: binding.connectionId },
    select: { id: true },
  });
  if (!conn) {
    throw new BadRequestError(
      `dataBinding.connectionId "${binding.connectionId}" does not reference an existing connection`,
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

export async function createChart(ctx: ActorContext, input: CreateChartInput): Promise<Chart> {
  const departmentId = input.departmentId ?? null;
  await assertDepartmentAccess(ctx, input.visibility, departmentId);
  assertValidCatalogType(input.catalogType);
  assertValidProps(input.catalogType, input.draftProps);
  await assertValidDataBinding(input.draftDataBinding);

  return prisma.chart.create({
    data: {
      title: input.title,
      catalogType: input.catalogType,
      draftProps: input.draftProps as Prisma.InputJsonValue,
      draftDataBinding: input.draftDataBinding as unknown as Prisma.InputJsonValue,
      ownerId: ctx.userId,
      departmentId,
      visibility: input.visibility,
      // status defaulta para DRAFT; published* permanecem null até o 1º publish.
    },
  });
}

export interface ListChartsParams {
  where: Record<string, unknown>;
  page: number;
  pageSize: number;
}

export async function listCharts({
  where,
  page,
  pageSize,
}: ListChartsParams): Promise<{ charts: Chart[]; total: number }> {
  const [charts, total] = await Promise.all([
    prisma.chart.findMany({
      where: where as Prisma.ChartWhereInput,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.chart.count({ where: where as Prisma.ChartWhereInput }),
  ]);
  return { charts, total };
}

/** Carrega um chart para LEITURA. 404 (não 403) se invisível, para não vazar existência. */
export async function requireChartForView(id: string, ctx: ActorContext): Promise<Chart> {
  const chart = await prisma.chart.findUnique({ where: { id } });
  if (!chart || !canViewArtifact(chart, ctx)) {
    throw new NotFoundError('Chart not found');
  }
  return chart;
}

/** Carrega um chart para EDIÇÃO/EXCLUSÃO/PUBLISH. 404 se inexistente; 403 se não dono. */
export async function requireChartForModify(id: string, ctx: ActorContext): Promise<Chart> {
  const chart = await prisma.chart.findUnique({ where: { id } });
  if (!chart) throw new NotFoundError('Chart not found');
  if (!canModifyArtifact(chart, ctx)) {
    throw new ForbiddenError('You can only modify charts you own');
  }
  return chart;
}

export async function updateChart(
  ctx: ActorContext,
  existing: Chart,
  input: UpdateChartInput,
): Promise<Chart> {
  // valores efetivos de visibilidade/departamento após o patch
  const nextVisibility = input.visibility ?? existing.visibility;
  const nextDepartmentId =
    input.departmentId !== undefined ? (input.departmentId ?? null) : existing.departmentId;
  await assertDepartmentAccess(ctx, nextVisibility, nextDepartmentId);

  const nextCatalogType = input.catalogType ?? existing.catalogType;
  if (input.catalogType !== undefined) assertValidCatalogType(input.catalogType);
  if (input.draftProps !== undefined) assertValidProps(nextCatalogType, input.draftProps);
  if (input.draftDataBinding !== undefined) await assertValidDataBinding(input.draftDataBinding);

  const data: Prisma.ChartUncheckedUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.catalogType !== undefined) data.catalogType = input.catalogType;
  if (input.draftProps !== undefined) data.draftProps = input.draftProps as Prisma.InputJsonValue;
  if (input.draftDataBinding !== undefined) {
    data.draftDataBinding = input.draftDataBinding as unknown as Prisma.InputJsonValue;
  }
  if (input.visibility !== undefined) data.visibility = input.visibility;
  if (input.departmentId !== undefined) data.departmentId = input.departmentId ?? null;

  // NOTA: editar o draft NUNCA toca os campos published* — o publicado só muda
  // num novo `publish`. É o isolamento draft↔published do modelo (doc 08).
  return prisma.chart.update({ where: { id: existing.id }, data });
}

export async function deleteChart(id: string): Promise<void> {
  await prisma.chart.delete({ where: { id } });
}

/** Copia draft→published, seta publishedAt e status=PUBLISHED (sem histórico). */
export async function publishChart(chart: Chart): Promise<Chart> {
  return prisma.chart.update({
    where: { id: chart.id },
    data: {
      publishedProps: chart.draftProps as Prisma.InputJsonValue,
      publishedDataBinding: chart.draftDataBinding as Prisma.InputJsonValue,
      publishedAt: new Date(),
      status: 'PUBLISHED',
    },
  });
}

/** Zera os campos published* e volta status=DRAFT. */
export async function unpublishChart(id: string): Promise<Chart> {
  return prisma.chart.update({
    where: { id },
    data: {
      publishedProps: Prisma.DbNull,
      publishedDataBinding: Prisma.DbNull,
      publishedAt: null,
      status: 'DRAFT',
    },
  });
}
