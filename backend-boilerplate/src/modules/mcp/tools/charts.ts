/**
 * Tools de CHARTS do MCP (T-D) — reusam o módulo `charts` (T-B2) e, para o
 * preview, o módulo `data` (T-C) + o pg-runner.
 *
 *   - create_chart        → cria um gráfico (draft).
 *   - update_chart        → edita os campos draft de um gráfico.
 *   - publish_chart       → promove draft→published.
 *   - preview_chart_data  → executa o dataBinding do chart e devolve o resultado
 *                           JÁ no shape do dataContract (para a IA conferir).
 *
 * Validação de argumentos: reusa os MESMOS schemas Zod das rotas REST
 * (`createChartBodySchema`/`updateChartBodySchema`) — mesma validação de entrada.
 * Regras de domínio (catalogType existe, props conformam, connectionId existe,
 * RBAC/ownership/visibilidade) vivem nos services e NÃO são reimplementadas.
 */
import { z } from 'zod';
import { getCatalogDataShape } from '@/lib/catalog';
import { runQuery } from '@/lib/pg-runner';
import {
  createChartBodySchema,
  serializeChart,
  updateChartBodySchema,
} from '@/modules/charts/schema';
import {
  createChart,
  deleteChart,
  publishChart,
  requireChartForModify,
  requireChartForView,
  unpublishChart,
  updateChart,
} from '@/modules/charts/service';
import { requireConnectionForUse } from '@/modules/connections/rbac';
import { toPgRunnerConnection } from '@/modules/connections/service';
import { executeBlockData } from '@/modules/data/executor';
import { assertPermission } from './guard';
import type { ToolDefinition } from './types';

/**
 * JSON Schema (resumido) do `dataBinding` — espelha `dataBindingSchema` (Zod) do
 * módulo charts. A FORMA é validada pelo Zod no handler; este schema é a doc da IA.
 */
const dataBindingJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['connectionId', 'query'],
  properties: {
    connectionId: { type: 'string', description: 'Conexão de onde os dados vêm.' },
    query: { type: 'string', description: 'SQL read-only (SELECT/WITH). $1,$2 para params.' },
    params: { type: 'array', items: {}, description: 'Valores posicionais dos placeholders.' },
    transform: {
      description:
        'Opcional. Mapeia o resultado da query para o shape do bloco. Identidade por ' +
        'convenção de coluna (scalar: value; series: x,y,series; categorical: label,value; ' +
        'table: columns+rows) ou objeto declarativo { x, y, series, label, value }.',
    },
    ttlSeconds: {
      type: 'integer',
      minimum: 0,
      maximum: 86400,
      description: 'TTL de cache (published). 0 = tempo real (sem cache).',
    },
  },
};

// --- create_chart -----------------------------------------------------------

const createChartTool: ToolDefinition = {
  name: 'create_chart',
  description:
    'Cria um novo gráfico (chart) em modo DRAFT, de propriedade do ator. `catalogType` DEVE ' +
    'ser um `type` do `list_catalog`; `draftProps` é validado contra o `propsSchema` desse ' +
    'tipo; `draftDataBinding.connectionId` deve existir (use `list_connections`). O chart ' +
    'nasce não publicado — chame `publish_chart` para publicá-lo. Retorna o chart criado ' +
    '(inclui o `id`).',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'catalogType', 'draftProps', 'draftDataBinding'],
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      catalogType: { type: 'string', description: 'Tipo de bloco (de list_catalog).' },
      draftProps: { type: 'object', description: 'Props visuais (validadas pelo propsSchema).' },
      draftDataBinding: dataBindingJsonSchema,
      departmentId: { type: 'string', description: 'Obrigatório quando visibility=DEPARTMENT.' },
      visibility: { type: 'string', enum: ['PRIVATE', 'DEPARTMENT', 'ORG'], default: 'PRIVATE' },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:manage');
    const input = createChartBodySchema.parse(rawArgs ?? {});
    const chart = await createChart(actor, input);
    return serializeChart(chart);
  },
};

// --- update_chart -----------------------------------------------------------

const updateChartArgs = z.object({ chartId: z.string().min(1) }).passthrough();

const updateChartTool: ToolDefinition = {
  name: 'update_chart',
  description:
    'Atualiza os campos DRAFT de um gráfico existente (título, props, dataBinding, ' +
    'visibilidade). Só o dono (ou ADMIN) pode editar. NÃO altera a versão publicada — ' +
    'edite o draft e depois chame `publish_chart` para promover. Passe `chartId` + os ' +
    'campos a alterar. Retorna o chart atualizado.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['chartId'],
    properties: {
      chartId: { type: 'string' },
      title: { type: 'string', minLength: 1, maxLength: 200 },
      catalogType: { type: 'string' },
      draftProps: { type: 'object' },
      draftDataBinding: dataBindingJsonSchema,
      departmentId: { type: 'string' },
      visibility: { type: 'string', enum: ['PRIVATE', 'DEPARTMENT', 'ORG'] },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:manage');
    const { chartId, ...rest } = updateChartArgs.parse(rawArgs ?? {});
    const input = updateChartBodySchema.parse(rest);
    const existing = await requireChartForModify(chartId, actor);
    const chart = await updateChart(actor, existing, input);
    return serializeChart(chart);
  },
};

// --- publish_chart ----------------------------------------------------------

const publishChartArgs = z.object({ chartId: z.string().min(1) });

const publishChartTool: ToolDefinition = {
  name: 'publish_chart',
  description:
    'Publica um gráfico: copia o conteúdo DRAFT para PUBLISHED, marca `publishedAt` e ' +
    'status=PUBLISHED. Só o dono (ou ADMIN). Retorna o chart publicado.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['chartId'],
    properties: { chartId: { type: 'string' } },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:publish');
    const { chartId } = publishChartArgs.parse(rawArgs ?? {});
    const existing = await requireChartForModify(chartId, actor);
    const chart = await publishChart(existing);
    return serializeChart(chart);
  },
};

// --- preview_chart_data -----------------------------------------------------

const previewArgs = z.object({
  chartId: z.string().min(1),
  mode: z.enum(['draft', 'published']).default('draft'),
});

interface BindingShape {
  connectionId?: string;
  query?: string;
  params?: unknown[];
  transform?: unknown;
}

const previewChartDataTool: ToolDefinition = {
  name: 'preview_chart_data',
  description:
    'Executa o dataBinding de um chart e devolve o resultado JÁ transformado no shape do ' +
    'seu `dataContract` — útil para a IA CONFERIR se o gráfico vai renderizar antes de ' +
    'publicar. `mode` = draft (padrão) usa o dataBinding em edição; published usa o ' +
    'publicado. Respeita a visibilidade do chart E da conexão. Retorna um BlockDataResult ' +
    '{ state: "success"|"error", shape, data, meta } — em erro, `error.code` indica o motivo ' +
    '(query_failed, contract_violation, ...).',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['chartId'],
    properties: {
      chartId: { type: 'string' },
      mode: { type: 'string', enum: ['draft', 'published'], default: 'draft' },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:view');
    const { chartId, mode } = previewArgs.parse(rawArgs ?? {});
    const chart = await requireChartForView(chartId, actor);

    const bindingRaw = (
      mode === 'published' ? chart.publishedDataBinding : chart.draftDataBinding
    ) as BindingShape | null;
    if (!bindingRaw || !bindingRaw.connectionId || !bindingRaw.query) {
      return {
        blockId: chartId,
        state: 'error' as const,
        error: { code: 'no_binding', message: `chart has no ${mode} dataBinding` },
      };
    }

    // Revalida visibilidade da conexão referenciada (404 → erro de tool no protocolo).
    const conn = await requireConnectionForUse(bindingRaw.connectionId, actor);
    const shape = getCatalogDataShape(chart.catalogType);

    return executeBlockData(
      {
        blockId: chartId,
        connection: toPgRunnerConnection(conn),
        sql: bindingRaw.query,
        paramsValues: Array.isArray(bindingRaw.params) ? bindingRaw.params : [],
        transform: bindingRaw.transform,
        shape,
        cached: false,
      },
      { runQuery },
    );
  },
};

// --- delete_chart ----------------------------------------------------------

const deleteChartArgs = z.object({ chartId: z.string().min(1) });

const deleteChartTool: ToolDefinition = {
  name: 'delete_chart',
  description:
    'Remove um gráfico (deleta do banco). Só o dono (ou ADMIN) pode deletar. ' +
    'Idempotente quanto a RBAC: chama `requireChartForModify` (verifica visibilidade + ownership). ' +
    'Retorna `{ id, deleted: true }`. Cuidado: dashboards que referenciam este chartId ' +
    'ficam com bloco órfão até você atualizar/remover o bloco via `update_dashboard`.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['chartId'],
    properties: { chartId: { type: 'string', description: 'Id do chart a deletar.' } },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:manage');
    const { chartId } = deleteChartArgs.parse(rawArgs ?? {});
    const existing = await requireChartForModify(chartId, actor);
    await deleteChart(existing.id);
    return { id: existing.id, deleted: true };
  },
};

// --- unpublish_chart -------------------------------------------------------

const unpublishChartArgs = z.object({ chartId: z.string().min(1) });

const unpublishChartTool: ToolDefinition = {
  name: 'unpublish_chart',
  description:
    'Despublica um gráfico: zera `publishedProps`/`publishedDataBinding`/`publishedAt` e ' +
    'volta o status para DRAFT. Só o dono (ou ADMIN). O chart continua existindo como ' +
    'rascunho. Retorna o chart despublicado.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['chartId'],
    properties: { chartId: { type: 'string', description: 'Id do chart a despublicar.' } },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:publish');
    const { chartId } = unpublishChartArgs.parse(rawArgs ?? {});
    const existing = await requireChartForModify(chartId, actor);
    const chart = await unpublishChart(existing.id);
    return serializeChart(chart);
  },
};

export const chartTools: ToolDefinition[] = [
  createChartTool,
  updateChartTool,
  publishChartTool,
  previewChartDataTool,
  deleteChartTool,
  unpublishChartTool,
];
