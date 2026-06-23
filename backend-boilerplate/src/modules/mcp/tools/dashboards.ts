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
  deleteDashboard,
  publishDashboard,
  requireDashboardForModify,
  unpublishDashboard,
  updateDashboard,
} from '@/modules/dashboards/service';
import { assertPermission } from './guard';
import { enrichBadRequest, type AiErrorRule, type ToolDefinition } from './types';

/**
 * Regras que transformam o `bad_request` GENÉRICO dos services de dashboard em
 * erros AUTOEXPLICATIVOS (sub-código `detail` + "como corrigir"), sem engolir a
 * mensagem do validador de layout (AJV traz os caminhos JSON). Espelha as
 * validações de `modules/dashboards/service.ts`.
 */
const DASHBOARD_WRITE_ERROR_RULES: AiErrorRule[] = [
  {
    match: /^Invalid dashboard layout/,
    detail: 'invalid_layout',
    hint:
      'o layout precisa seguir o contrato DashboardLayout { filters:[], rows:[{ id, blocks:[{ ' +
      'id, type, span }] }] }. Corrija os caminhos JSON citados (ex.: /rows/0/blocks/0/span ' +
      'must be <= 12). type = catalogType de list_catalog; span é 1..12.',
  },
  {
    match: /references unknown chartId/,
    detail: 'unknown_chart_ref',
    hint: 'cada bloco de gráfico referencia props.chartId; o chart precisa existir (create_chart) e ser visível.',
  },
  {
    match: /^row .* not found/,
    detail: 'row_not_found',
    hint: 'omita rowId para criar uma nova linha ao final, ou passe um rowId existente do layout.',
  },
  {
    match: /departmentId is required/,
    detail: 'missing_department',
    hint: 'informe departmentId (dono do artefato) ou troque visibility para PRIVATE ou ORG.',
  },
  {
    match: /department not found/,
    detail: 'department_not_found',
    hint: 'confirme o departmentId — ele precisa existir e (salvo ADMIN) você precisa ser membro.',
  },
];

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
        'Linhas com blocos. Cada bloco: { id, type, span?, props? }. `type` = catalogType ' +
        '(de list_catalog); `span` é 1..12 (largura na grade de 12 colunas). Para blocos de ' +
        'gráfico use props.chartId apontando para um chart EXISTENTE e visível. ' +
        'Dica: prefira add_chart_to_dashboard para inserir um chart sem montar o JSON na mão.',
    },
  },
};

// --- create_dashboard -------------------------------------------------------

const createDashboardTool: ToolDefinition = {
  name: 'create_dashboard',
  description:
    'OBJETIVO: cria um dashboard em modo DRAFT, de propriedade do ator. QUANDO USAR: depois ' +
    'de ter os charts prontos (create_chart/publish_chart), para agrupá-los numa página. ' +
    'INPUT (obrigatórios): `title` e `draftLayout` seguindo o contrato DashboardLayout: ' +
    '{ filters: [...], rows: [{ id, blocks: [{ id, type, span?, props? }] }] }. Blocos de ' +
    'gráfico referenciam um chart via `props.chartId` (o chart precisa existir e ser visível). ' +
    '`visibility` é UPPERCASE (PRIVATE|DEPARTMENT|ORG, default PRIVATE); DEPARTMENT exige ' +
    '`departmentId`. DICA: crie com layout vazio ({ filters: [], rows: [] }) e use ' +
    'add_chart_to_dashboard depois — é mais simples que montar o JSON na mão. ' +
    'RETORNA: o dashboard criado (inclui `id`, status=DRAFT) — publique depois com ' +
    'publish_dashboard. ERROS (code=bad_request com `detail`): `invalid_layout` (layout fora ' +
    'do contrato — a mensagem traz os caminhos JSON), `unknown_chart_ref` (props.chartId ' +
    'inexistente), `missing_department` (DEPARTMENT sem departmentId); `forbidden` (sem ' +
    'permissão artifacts:manage).',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'draftLayout'],
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200, description: 'Título do dashboard.' },
      draftLayout: layoutJsonSchema,
      departmentId: { type: 'string', description: 'Obrigatório quando visibility=DEPARTMENT.' },
      visibility: {
        type: 'string',
        enum: ['PRIVATE', 'DEPARTMENT', 'ORG'],
        default: 'PRIVATE',
        description: 'UPPERCASE. PRIVATE | DEPARTMENT (exige departmentId) | ORG.',
      },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:manage');
    const input = createDashboardBodySchema.parse(rawArgs ?? {});
    try {
      const dashboard = await createDashboard(actor, input);
      return serializeDashboard(dashboard);
    } catch (e) {
      throw enrichBadRequest(e, DASHBOARD_WRITE_ERROR_RULES);
    }
  },
};

// --- update_dashboard -------------------------------------------------------

const updateDashboardArgs = z.object({ dashboardId: z.string().min(1) }).passthrough();

const updateDashboardTool: ToolDefinition = {
  name: 'update_dashboard',
  description:
    'OBJETIVO: atualiza os campos DRAFT de um dashboard (título, layout, visibilidade). ' +
    'QUANDO USAR: para ajustar o layout/visibilidade antes (ou depois) de publicar. INPUT: ' +
    '`dashboardId` (obrigatório) + só os campos a alterar (envie pelo menos um). `draftLayout`, ' +
    'se enviado, segue o mesmo contrato do create_dashboard; `visibility` UPPERCASE. Só o dono ' +
    '(ou ADMIN). NÃO altera a versão publicada — edite o draft e chame publish_dashboard. ' +
    'RETORNA: o dashboard atualizado. ERROS: `not_found` (dashboardId inexistente/invisível), ' +
    '`forbidden` (não é o dono) e os mesmos `detail` do create_dashboard (invalid_layout, ' +
    'unknown_chart_ref, missing_department).',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['dashboardId'],
    properties: {
      dashboardId: { type: 'string', description: 'Id do dashboard a editar.' },
      title: { type: 'string', minLength: 1, maxLength: 200 },
      draftLayout: layoutJsonSchema,
      departmentId: { type: 'string' },
      visibility: {
        type: 'string',
        enum: ['PRIVATE', 'DEPARTMENT', 'ORG'],
        description: 'UPPERCASE. DEPARTMENT exige departmentId.',
      },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:manage');
    const { dashboardId, ...rest } = updateDashboardArgs.parse(rawArgs ?? {});
    const input = updateDashboardBodySchema.parse(rest);
    try {
      const existing = await requireDashboardForModify(dashboardId, actor);
      const dashboard = await updateDashboard(actor, existing, input);
      return serializeDashboard(dashboard);
    } catch (e) {
      throw enrichBadRequest(e, DASHBOARD_WRITE_ERROR_RULES);
    }
  },
};

// --- add_chart_to_dashboard -------------------------------------------------

const addChartArgs = z.object({ dashboardId: z.string().min(1) }).passthrough();

const addChartToDashboardTool: ToolDefinition = {
  name: 'add_chart_to_dashboard',
  description:
    'OBJETIVO: insere um bloco que referencia um chart existente no layout DRAFT de um ' +
    'dashboard (jeito mais simples de montar o layout — sem editar o JSON na mão). QUANDO ' +
    'USAR: depois de create_dashboard, uma chamada por chart. INPUT: `dashboardId` e `chartId` ' +
    '(obrigatórios). O bloco é criado com type = catalogType do chart e props.chartId = ' +
    'chartId. `rowId` omitido → cria uma nova linha ao final; `position` controla a ordem na ' +
    'linha; `span` (1..12) a largura. O chart precisa existir e ser visível ao ator. ' +
    'RETORNA: o dashboard atualizado. ERROS: `not_found` (dashboard OU chart inexistente/' +
    'invisível — note que um chart de outro departamento aparece como not_found, não ' +
    'forbidden), `forbidden` (não é o dono do dashboard), `bad_request` detail=`row_not_found` ' +
    '(rowId informado não existe no layout).',
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
    try {
      const existing = await requireDashboardForModify(dashboardId, actor);
      const dashboard = await addChartToDashboard(actor, existing, input);
      return serializeDashboard(dashboard);
    } catch (e) {
      throw enrichBadRequest(e, DASHBOARD_WRITE_ERROR_RULES);
    }
  },
};

// --- publish_dashboard ------------------------------------------------------

const publishDashboardArgs = z.object({ dashboardId: z.string().min(1) });

const publishDashboardTool: ToolDefinition = {
  name: 'publish_dashboard',
  description:
    'OBJETIVO: publica um dashboard — copia o `draftLayout` para `publishedLayout`, ' +
    'MATERIALIZA um snapshot dos dados de cada bloco (executa os dataBinding), marca ' +
    '`publishedAt`/status=PUBLISHED e invalida o cache de layout. QUANDO USAR: o último passo, ' +
    'depois de montar/conferir o layout. INPUT: `dashboardId`. Só o dono (ou ADMIN) — exige ' +
    'artifacts:publish. RETORNA: o dashboard publicado. ERROS: `not_found` (inexistente/' +
    'invisível), `forbidden` (não é o dono / sem permissão), `bad_request` detail=`invalid_layout` ' +
    '(o draft atual não é um layout válido).',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['dashboardId'],
    properties: { dashboardId: { type: 'string' } },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:publish');
    const { dashboardId } = publishDashboardArgs.parse(rawArgs ?? {});
    try {
      const existing = await requireDashboardForModify(dashboardId, actor);
      const dashboard = await publishDashboard(existing, actor);
      return serializeDashboard(dashboard);
    } catch (e) {
      throw enrichBadRequest(e, DASHBOARD_WRITE_ERROR_RULES);
    }
  },
};

// --- delete_dashboard ------------------------------------------------------

const deleteDashboardArgs = z.object({ dashboardId: z.string().min(1) });

const deleteDashboardTool: ToolDefinition = {
  name: 'delete_dashboard',
  description:
    'OBJETIVO: remove um dashboard permanentemente (deleta do banco) e invalida o cache de ' +
    'layout publicado. INPUT: `dashboardId`. Só o dono (ou ADMIN) — exige artifacts:manage. ' +
    'RETORNA: `{ id, deleted: true }`. Os charts referenciados NÃO são deletados (continuam ' +
    'existindo). ERROS: `not_found` (inexistente/invisível), `forbidden` (não é o dono).',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['dashboardId'],
    properties: {
      dashboardId: { type: 'string', description: 'Id do dashboard a deletar.' },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:manage');
    const { dashboardId } = deleteDashboardArgs.parse(rawArgs ?? {});
    const existing = await requireDashboardForModify(dashboardId, actor);
    await deleteDashboard(existing.id);
    return { id: existing.id, deleted: true };
  },
};

// --- unpublish_dashboard ---------------------------------------------------

const unpublishDashboardArgs = z.object({ dashboardId: z.string().min(1) });

const unpublishDashboardTool: ToolDefinition = {
  name: 'unpublish_dashboard',
  description:
    'OBJETIVO: despublica um dashboard — zera `publishedLayout`/`publishedDataPayload`/' +
    '`publishedAt`, volta o status para DRAFT e invalida o cache. QUANDO USAR: para tirar do ' +
    'ar (inclusive o link público) sem deletar; o dashboard continua como rascunho editável. ' +
    'INPUT: `dashboardId`. Só o dono (ou ADMIN) — exige artifacts:publish. RETORNA: o ' +
    'dashboard despublicado. ERROS: `not_found` (inexistente/invisível), `forbidden` (não é o dono).',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['dashboardId'],
    properties: {
      dashboardId: { type: 'string', description: 'Id do dashboard a despublicar.' },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:publish');
    const { dashboardId } = unpublishDashboardArgs.parse(rawArgs ?? {});
    const existing = await requireDashboardForModify(dashboardId, actor);
    const dashboard = await unpublishDashboard(existing.id);
    return serializeDashboard(dashboard);
  },
};

export const dashboardTools: ToolDefinition[] = [
  createDashboardTool,
  updateDashboardTool,
  addChartToDashboardTool,
  publishDashboardTool,
  deleteDashboardTool,
  unpublishDashboardTool,
];
