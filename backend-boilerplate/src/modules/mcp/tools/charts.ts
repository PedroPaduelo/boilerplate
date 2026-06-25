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
import { buildVisibilityWhere } from '@/lib/visibility';
import {
  createChartBodySchema,
  serializeChart,
  updateChartBodySchema,
} from '@/modules/charts/schema';
import {
  createChart,
  deleteChart,
  listCharts,
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
import { enrichBadRequest, type AiErrorRule, type ToolDefinition } from './types';

/**
 * Regras que transformam o `bad_request` GENÉRICO dos services de chart em erros
 * AUTOEXPLICATIVOS (sub-código `detail` + "como corrigir"). A IA distingue a
 * causa pelo `detail` sem parsear a mensagem; a mensagem do validador (props
 * AJV) continua visível. Espelha as validações de `modules/charts/service.ts`.
 */
const CHART_WRITE_ERROR_RULES: AiErrorRule[] = [
  {
    match: /^Unknown catalogType/,
    detail: 'unknown_catalog_type',
    hint: 'use list_catalog e passe em catalogType exatamente o campo "type" de um item existente.',
  },
  {
    match: /^Invalid props for catalogType/,
    detail: 'invalid_props',
    hint:
      'cada prop de draftProps precisa conformar ao propsSchema do tipo (veja em list_catalog ' +
      'o tipo/enum/description de cada prop). Corrija os caminhos citados acima.',
  },
  {
    match: /does not reference an existing connection/,
    detail: 'unknown_connection',
    hint: 'use list_connections para obter um connectionId válido para draftDataBinding.',
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

/**
 * JSON Schema (resumido) do `dataBinding` — espelha `dataBindingSchema` (Zod) do
 * módulo charts. A FORMA é validada pelo Zod no handler; este schema é a doc da IA.
 */
const dataBindingJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['connectionId', 'query'],
  properties: {
    connectionId: {
      type: 'string',
      description: 'Conexão de onde os dados vêm — id de list_connections (precisa existir).',
    },
    query: {
      type: 'string',
      description:
        'SQL SOMENTE-LEITURA (SELECT/WITH). Use $1,$2 para params. As COLUNAS do SELECT ' +
        'devem seguir a convenção do shape do bloco: scalar→`value` (+label/unit/delta); ' +
        'series→`x`,`y` (+`series`); categorical→`label`,`value`; table→colunas livres. ' +
        'No Postgres, nomes com maiúsculas/schema custom são CASE-SENSITIVE: use aspas duplas ' +
        '("SCH"."TABELA"). Prefira agregar (GROUP BY) a trazer linhas cruas.',
    },
    params: { type: 'array', items: {}, description: 'Valores posicionais dos placeholders $1..$n.' },
    transform: {
      description:
        'Opcional. Mapeia o resultado da query para o shape do bloco quando as colunas NÃO ' +
        'seguem a convenção. Identidade por convenção de coluna (scalar: value; series: ' +
        'x,y,series; categorical: label,value; table: columns+rows) ou objeto declarativo ' +
        '{ x, y, series, label, value } apontando nomes de coluna do resultado.',
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
    'OBJETIVO: cria um novo gráfico (chart) em modo DRAFT, de propriedade do ator. ' +
    'QUANDO USAR: no fluxo, DEPOIS de descobrir o tipo (list_catalog), a conexão ' +
    '(list_connections) e de validar a query (run_query). INPUT (obrigatórios): `title`; ' +
    '`catalogType` = exatamente um `type` do list_catalog; `draftProps` = props visuais ' +
    '(validadas contra o `propsSchema` desse tipo); `draftDataBinding` = { connectionId, query } ' +
    '(connectionId precisa existir — use list_connections). `visibility` é UPPERCASE ' +
    '(PRIVATE|DEPARTMENT|ORG, default PRIVATE); DEPARTMENT exige `departmentId`. ' +
    'CONVENÇÃO DE COLUNAS do SELECT por shape do dataContract (veja list_catalog): ' +
    'scalar→coluna `value` (+ label/unit/delta); series→`x`,`y` (+ `series`); ' +
    'categorical→`label`,`value`; table→cada coluna do SELECT vira uma coluna. ' +
    'Ou use `draftDataBinding.transform` declarativo { x, y, series, label, value }. ' +
    'RETORNA: o chart criado (inclui `id`, status=DRAFT). ' +
    'PRÉ-REQUISITO/ORDEM: o chart nasce NÃO publicado — depois rode preview_chart_data para ' +
    'CONFERIR que renderiza, e só então publish_chart. ' +
    'ERROS (code=bad_request com `detail`): `unknown_catalog_type` (catalogType inexistente → ' +
    'list_catalog), `invalid_props` (props fora do propsSchema — a mensagem traz os caminhos), ' +
    '`unknown_connection` (connectionId inexistente → list_connections), `missing_department` ' +
    '(visibility=DEPARTMENT sem departmentId); `invalid_arguments` (forma dos args); ' +
    '`forbidden` (sem permissão artifacts:manage).',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'catalogType', 'draftProps', 'draftDataBinding'],
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200, description: 'Título do chart.' },
      catalogType: {
        type: 'string',
        description: 'Tipo de bloco: exatamente o `type` de um item do list_catalog.',
      },
      draftProps: {
        type: 'object',
        description: 'Props visuais — validadas contra o propsSchema do catalogType (list_catalog).',
      },
      draftDataBinding: dataBindingJsonSchema,
      departmentId: { type: 'string', description: 'Obrigatório quando visibility=DEPARTMENT.' },
      visibility: {
        type: 'string',
        enum: ['PRIVATE', 'DEPARTMENT', 'ORG'],
        default: 'PRIVATE',
        description: 'UPPERCASE. PRIVATE (só o dono) | DEPARTMENT (exige departmentId) | ORG.',
      },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:manage');
    const input = createChartBodySchema.parse(rawArgs ?? {});
    try {
      const chart = await createChart(actor, input);
      return serializeChart(chart);
    } catch (e) {
      throw enrichBadRequest(e, CHART_WRITE_ERROR_RULES);
    }
  },
};

// --- update_chart -----------------------------------------------------------

const updateChartArgs = z.object({ chartId: z.string().min(1) }).passthrough();

const updateChartTool: ToolDefinition = {
  name: 'update_chart',
  description:
    'OBJETIVO: atualiza os campos DRAFT de um gráfico existente (título, props, dataBinding, ' +
    'visibilidade). QUANDO USAR: para corrigir/ajustar um chart antes (ou depois) de publicar. ' +
    'INPUT: `chartId` (obrigatório) + só os campos a alterar (envie pelo menos um). As mesmas ' +
    'regras do create_chart valem para os campos enviados: catalogType de list_catalog, ' +
    'draftProps conforme o propsSchema, draftDataBinding.connectionId existente, visibility ' +
    'UPPERCASE. Só o dono (ou ADMIN) pode editar. NÃO altera a versão publicada — edite o ' +
    'draft e chame publish_chart para promover. RETORNA: o chart atualizado. ' +
    'ERROS: `not_found` (chartId inexistente/invisível), `forbidden` (não é o dono) e os ' +
    'mesmos `detail` do create_chart (unknown_catalog_type, invalid_props, unknown_connection, ' +
    'missing_department).',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['chartId'],
    properties: {
      chartId: { type: 'string', description: 'Id do chart a editar (de create_chart/list).' },
      title: { type: 'string', minLength: 1, maxLength: 200 },
      catalogType: { type: 'string', description: 'Novo tipo (de list_catalog).' },
      draftProps: { type: 'object', description: 'Novas props (validadas pelo propsSchema).' },
      draftDataBinding: dataBindingJsonSchema,
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
    const { chartId, ...rest } = updateChartArgs.parse(rawArgs ?? {});
    const input = updateChartBodySchema.parse(rest);
    try {
      const existing = await requireChartForModify(chartId, actor);
      const chart = await updateChart(actor, existing, input);
      return serializeChart(chart);
    } catch (e) {
      throw enrichBadRequest(e, CHART_WRITE_ERROR_RULES);
    }
  },
};

// --- publish_chart ----------------------------------------------------------

const publishChartArgs = z.object({ chartId: z.string().min(1) });

const publishChartTool: ToolDefinition = {
  name: 'publish_chart',
  description:
    'OBJETIVO: publica um gráfico — copia o conteúdo DRAFT para PUBLISHED, marca `publishedAt` ' +
    'e status=PUBLISHED. QUANDO USAR: o ÚLTIMO passo do chart, DEPOIS de preview_chart_data ' +
    'confirmar que o gráfico renderiza (state="success"). INPUT: `chartId`. Só o dono (ou ' +
    'ADMIN) — exige permissão artifacts:publish. RETORNA: o chart publicado. ' +
    'ERROS: `not_found` (chartId inexistente/invisível), `forbidden` (não é o dono / sem ' +
    'permissão de publicar).',
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
    'OBJETIVO: executa o dataBinding de um chart e devolve o resultado JÁ transformado no ' +
    'shape do seu `dataContract` — para a IA CONFERIR se o gráfico vai renderizar ANTES de ' +
    'publicar. QUANDO USAR: sempre entre create_chart/update_chart e publish_chart (rede de ' +
    'segurança). INPUT: `chartId`; `mode` = draft (padrão, usa o dataBinding em edição) ou ' +
    'published (usa o publicado). Respeita a visibilidade do chart E da conexão. RETORNA: um ' +
    'BlockDataResult { state: "success"|"error", shape, data, meta }. ' +
    'Em erro, `error.code` indica o motivo: `no_binding` (o chart não tem dataBinding nesse ' +
    'mode — crie/edite o draft, ou tente o outro mode), `query_failed` (SQL falhou — confira ' +
    'a query com run_query), `contract_violation` (o resultado não bate com o shape do ' +
    'dataContract — a mensagem traz os caminhos; ajuste as colunas do SELECT ou o transform), ' +
    '`transform_failed`. Erro de visibilidade vira `not_found`.',
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
        error: {
          code: 'no_binding',
          message:
            `chart has no ${mode} dataBinding` +
            (mode === 'published'
              ? ' — publique o chart (publish_chart) ou use mode="draft" para pré-visualizar o rascunho.'
              : ' — defina draftDataBinding via create_chart/update_chart antes de pré-visualizar.'),
        },
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
    'OBJETIVO: remove um gráfico permanentemente (deleta do banco). INPUT: `chartId`. Só o ' +
    'dono (ou ADMIN) — exige artifacts:manage. RETORNA: `{ id, deleted: true }`. ' +
    'CUIDADO: dashboards que referenciam este chartId (via props.chartId) ficam com bloco ' +
    'órfão até você atualizar/remover o bloco com update_dashboard. ' +
    'ERROS: `not_found` (chartId inexistente/invisível), `forbidden` (não é o dono).',
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
    'OBJETIVO: despublica um gráfico — zera `publishedProps`/`publishedDataBinding`/' +
    '`publishedAt` e volta o status para DRAFT. QUANDO USAR: para tirar do ar um chart ' +
    'publicado sem deletá-lo (ele continua existindo como rascunho editável). INPUT: ' +
    '`chartId`. Só o dono (ou ADMIN) — exige artifacts:publish. RETORNA: o chart ' +
    'despublicado. ERROS: `not_found` (inexistente/invisível), `forbidden` (não é o dono).',
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

// --- list_charts ------------------------------------------------------------

const listChartsArgs = z.object({
  search: z.string().optional(),
  catalogType: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const listChartsTool: ToolDefinition = {
  name: 'list_charts',
  description:
    'OBJETIVO: lista os CHARTS (gráficos) visíveis ao ator (respeita RBAC/visibilidade — ' +
    'PRIVATE/DEPARTMENT/ORG). QUANDO USAR: para descobrir quais gráficos já existem (ex.: para ' +
    'reaproveitar num dashboard via add_chart_to_dashboard, ou dar informações ao usuário). ' +
    'INPUT (todos opcionais): `search` (filtra por título, case-insensitive), `catalogType` ' +
    '(tipo de bloco), `status` (DRAFT|PUBLISHED), `page` (default 1), `pageSize` (default 20, ' +
    'máx 100). RETORNA metadados LEVES (sem props/dataBinding): { charts: [{ id, title, ' +
    'catalogType, status, visibility, updatedAt }], total, page, pageSize, totalPages }. ' +
    'RBAC: exige artifacts:view.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      search: { type: 'string', description: 'Filtra por título (case-insensitive).' },
      catalogType: { type: 'string', description: 'Filtra por tipo de bloco (opcional).' },
      status: {
        type: 'string',
        enum: ['DRAFT', 'PUBLISHED'],
        description: 'Filtra por status (opcional).',
      },
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
  },
  handler: async (rawArgs, { actor }) => {
    assertPermission(actor, 'artifacts:view');
    const { search, catalogType, status, page, pageSize } = listChartsArgs.parse(rawArgs ?? {});
    const filters: Record<string, unknown> = {};
    if (search) filters.title = { contains: search, mode: 'insensitive' };
    if (catalogType) filters.catalogType = catalogType;
    if (status) filters.status = status;
    const where = { AND: [buildVisibilityWhere(actor), filters] };
    const { charts, total } = await listCharts({ where, page, pageSize });
    return {
      charts: charts.map((c) => ({
        id: c.id,
        title: c.title,
        catalogType: c.catalogType,
        status: c.status,
        visibility: c.visibility,
        updatedAt: c.updatedAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
};

export const chartTools: ToolDefinition[] = [
  listChartsTool,
  createChartTool,
  updateChartTool,
  publishChartTool,
  previewChartDataTool,
  deleteChartTool,
  unpublishChartTool,
];
