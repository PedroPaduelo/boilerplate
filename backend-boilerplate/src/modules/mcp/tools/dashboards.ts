/**
 * Tools de DASHBOARDS do MCP (T-D) — reusam o módulo `dashboards` (T-B3).
 *
 *   - create_dashboard        → cria um dashboard (draft) com layout { filters, rows }.
 *   - update_dashboard        → edita os campos draft (título, layout, visibilidade).
 *   - add_chart_to_dashboard  → insere um bloco que referencia um chart no layout draft.
 *   - publish_dashboard       → promove draftLayout→publishedLayout (invalida cache).
 *
 * Validação de argumentos reusa os schemas Zod das rotas REST
 * (`createDashboardBodySchema`/`updateDashboardBodySchema`/`addChartBodySchema`).
 * O LAYOUT é validado contra o CONTRATO compartilhado (`@dashboards/contracts`)
 * dentro do service — regra não reimplementada aqui.
 */
import { z } from 'zod';
import {
  addChartBodySchema,
  createDashboardBodySchema,
  serializeDashboard,
  updateDashboardBodySchema,
} from '@/modules/dashboards/schema';
import {
  addChartToDashboard,
  createDashboard,
  publishDashboard,
  requireDashboardForModify,
  updateDashboard,
} from '@/modules/dashboards/service';
import { assertPermission } from './guard';
import type { ToolDefinition } from './types';

/** JSON Schema do layout `{ filters, rows }` (conteúdo validado pelo contrato no service). */
const layoutJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['filters', 'rows'],
  properties: {
    filters: {
      type: 'array',
      items: {},
      description: 'Filtros do dashboard (ver contrato DashboardLayout).',
    },
    rows: {
      type: 'array',
      items: {},
      description:
        'Linhas com blocos. Cada bloco: { id, type, span?, props? }. type = catalogType ' +
        '(de list_catalog); para blocos de gráfico use props.chartId apontando para um chart.',
    },
  },
};

// --- create_dashboard -------------------------------------------------------

const createDashboardTool: ToolDefinition = {
  name: 'create_dashboard',
  description:
    'Cria um dashboard em modo DRAFT, de propriedade do ator. `draftLayout` segue o ' +
    'contrato DashboardLayout: { filters: [...], rows: [{ id, blocks: [{ id, type, span?, ' +
    'props? }] }] }. Blocos de gráfico referenciam um chart via `props.chartId` (o chart ' +
    'precisa existir e ser visível). Layout inválido → erro com a mensagem do validador. ' +
    'Dica: você pode criar com layout vazio ({ filters: [], rows: [] }) e usar ' +
    '`add_chart_to_dashboard` depois. Retorna o dashboard criado (inclui o `id`).',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'draftLayout'],
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      draftLayout: layoutJsonSchema,
      departmentId: { type: 'string', description: 'Obrigatório quando visibility=DEPARTMENT.' },
      visibility: { type: 'string', enum: ['PRIVATE', 'DEPARTMENT', 'ORG'], default: 'PRIVATE' },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:manage');
    const input = createDashboardBodySchema.parse(rawArgs ?? {});
    const dashboard = await createDashboard(actor, input);
    return serializeDashboard(dashboard);
  },
};

// --- update_dashboard -------------------------------------------------------

const updateDashboardArgs = z.object({ dashboardId: z.string().min(1) }).passthrough();

const updateDashboardTool: ToolDefinition = {
  name: 'update_dashboard',
  description:
    'Atualiza os campos DRAFT de um dashboard (título, layout, visibilidade). Só o dono ' +
    '(ou ADMIN). NÃO altera a versão publicada — edite o draft e chame `publish_dashboard`. ' +
    'Passe `dashboardId` + os campos a alterar. Retorna o dashboard atualizado.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['dashboardId'],
    properties: {
      dashboardId: { type: 'string' },
      title: { type: 'string', minLength: 1, maxLength: 200 },
      draftLayout: layoutJsonSchema,
      departmentId: { type: 'string' },
      visibility: { type: 'string', enum: ['PRIVATE', 'DEPARTMENT', 'ORG'] },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:manage');
    const { dashboardId, ...rest } = updateDashboardArgs.parse(rawArgs ?? {});
    const input = updateDashboardBodySchema.parse(rest);
    const existing = await requireDashboardForModify(dashboardId, actor);
    const dashboard = await updateDashboard(actor, existing, input);
    return serializeDashboard(dashboard);
  },
};

// --- add_chart_to_dashboard -------------------------------------------------

const addChartArgs = z.object({ dashboardId: z.string().min(1) }).passthrough();

const addChartToDashboardTool: ToolDefinition = {
  name: 'add_chart_to_dashboard',
  description:
    'Insere um bloco que referencia um chart existente no layout DRAFT de um dashboard. ' +
    'O bloco é criado com type = catalogType do chart e props.chartId = chartId. Se `rowId` ' +
    'for omitido, uma nova linha é criada ao final; `position` controla a ordem dentro da ' +
    'linha; `span` (1..12) a largura. O chart precisa existir e ser visível ao ator. ' +
    'Retorna o dashboard atualizado.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['dashboardId', 'chartId'],
    properties: {
      dashboardId: { type: 'string' },
      chartId: { type: 'string', description: 'Chart a inserir (de list/create_chart).' },
      rowId: { type: 'string', description: 'Linha alvo; se omitido, cria nova linha ao final.' },
      span: { type: 'integer', minimum: 1, maximum: 12, default: 6 },
      position: { type: 'integer', minimum: 0, description: 'Posição na linha (default: fim).' },
      blockId: { type: 'string', description: 'Id do bloco (gerado se omitido).' },
      props: { type: 'object', description: 'Props extras do bloco (chartId é adicionado).' },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:manage');
    const { dashboardId, ...rest } = addChartArgs.parse(rawArgs ?? {});
    const input = addChartBodySchema.parse(rest);
    const existing = await requireDashboardForModify(dashboardId, actor);
    const dashboard = await addChartToDashboard(actor, existing, input);
    return serializeDashboard(dashboard);
  },
};

// --- publish_dashboard ------------------------------------------------------

const publishDashboardArgs = z.object({ dashboardId: z.string().min(1) });

const publishDashboardTool: ToolDefinition = {
  name: 'publish_dashboard',
  description:
    'Publica um dashboard: copia o `draftLayout` para `publishedLayout`, marca ' +
    '`publishedAt`/status=PUBLISHED e invalida o cache de layout. Só o dono (ou ADMIN). ' +
    'Retorna o dashboard publicado.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['dashboardId'],
    properties: { dashboardId: { type: 'string' } },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:publish');
    const { dashboardId } = publishDashboardArgs.parse(rawArgs ?? {});
    const existing = await requireDashboardForModify(dashboardId, actor);
    const dashboard = await publishDashboard(existing, actor);
    return serializeDashboard(dashboard);
  },
};

export const dashboardTools: ToolDefinition[] = [
  createDashboardTool,
  updateDashboardTool,
  addChartToDashboardTool,
  publishDashboardTool,
];
