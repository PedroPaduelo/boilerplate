/**
 * Tools de CONEXÕES do MCP (T-D) — reusam o módulo `connections` (T-A).
 *
 *   - list_connections        → lista conexões VISÍVEIS ao ator (RBAC + visibilidade).
 *   - get_connection_schema   → introspecção de tabelas/colunas (cache Redis).
 *   - run_query               → SELECT read-only de PREVIEW (guardrails do pg-runner).
 *
 * NADA de lógica nova: reusa `listConnections`/`introspectSchema`/`runConnectionQuery`
 * (service) e `buildVisibilityWhere`/`canUseConnections`/`requireConnectionForUse`
 * (rbac do módulo) — a MESMA superfície das rotas REST, então o agente externo
 * tem exatamente a mesma visibilidade e os mesmos guardrails read-only.
 */
import { z } from 'zod';
import { ForbiddenError } from '@/http/routes/_errors';
import { PgRunnerError, SqlGuardError } from '@/lib/pg-runner';
import {
  buildVisibilityWhere,
  canUseConnections,
  requireConnectionForUse,
} from '@/modules/connections/rbac';
import { serializeConnection } from '@/modules/connections/schema';
import {
  introspectSchema,
  listConnections,
  runConnectionQuery,
} from '@/modules/connections/service';
import type { ToolDefinition } from './types';
import { McpToolError } from './types';

// --- list_connections -------------------------------------------------------

const listArgs = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

const listConnectionsTool: ToolDefinition = {
  name: 'list_connections',
  description:
    'Lista as conexões de banco de dados disponíveis para o ator (respeita RBAC e ' +
    'visibilidade). Use para descobrir qual `connectionId` usar em `get_connection_schema`, ' +
    '`run_query` e no `dataBinding` de `create_chart`/`update_chart`. Retorna { connections: ' +
    '[{ id, name, type, host, database, visibility, status, ... }], total, page, pageSize }. ' +
    'Nunca retorna senha/credenciais.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      search: { type: 'string', description: 'Filtro por nome/host/database/descrição.' },
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    },
  },
  handler: async (rawArgs, { actor }) => {
    const { search, page, pageSize } = listArgs.parse(rawArgs ?? {});
    if (!canUseConnections(actor.role)) {
      throw new ForbiddenError('You do not have permission to use connections');
    }
    const filters: Record<string, unknown> = {};
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { database: { contains: search, mode: 'insensitive' } },
        { host: { contains: search, mode: 'insensitive' } },
      ];
    }
    const where = { AND: [buildVisibilityWhere(actor), filters] };
    const { connections, total } = await listConnections({ where, page, pageSize });
    return {
      connections: connections.map(serializeConnection),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
};

// --- get_connection_schema --------------------------------------------------

/**
 * Caps defensivos do `get_connection_schema` para NÃO estourar a janela de
 * contexto do agente externo (Claude Code) em bancos reais (centenas de tabelas
 * × dezenas de colunas = MBs de schema). A introspecção (cacheada) continua
 * trazendo tudo; nós FILTRAMOS/PROJETAMOS o resultado antes de devolver.
 */
const SCHEMA_TABLES_PAGE_SIZE_DEFAULT = 200;
const SCHEMA_TABLES_PAGE_SIZE_MAX = 500;
/** Teto de tabelas DETALHADAS (com colunas) por chamada do modo `tables`. */
const SCHEMA_MAX_DETAILED_TABLES = 50;
/** Teto de colunas TOTAIS retornadas no modo `tables` (projeção de colunas). */
const SCHEMA_MAX_TOTAL_COLUMNS = 1500;

const schemaArgs = z.object({
  connectionId: z.string().min(1),
  tables: z.array(z.string().min(1)).optional(),
  search: z.string().optional(),
  schema: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(SCHEMA_TABLES_PAGE_SIZE_MAX).default(SCHEMA_TABLES_PAGE_SIZE_DEFAULT),
  refresh: z.boolean().optional(),
});

/** Normaliza um nome pedido em `tables` para casar contra a introspecção. */
function tableMatches(
  table: { schema: string; name: string },
  requested: string,
): boolean {
  const req = requested.trim().toLowerCase();
  const full = `${table.schema}.${table.name}`.toLowerCase();
  const bare = table.name.toLowerCase();
  if (req.includes('.')) return full === req;
  // sem schema explícito: casa por nome de tabela (em qualquer schema)
  return bare === req || full === req;
}

const getConnectionSchemaTool: ToolDefinition = {
  name: 'get_connection_schema',
  description:
    'Introspecta o schema de uma conexão para você montar as queries SQL — em DOIS PASSOS, ' +
    'para NÃO estourar a sua janela de contexto em bancos grandes. ' +
    'PASSO 1: chame só com `connectionId` para obter a LISTA de tabelas (leve): ' +
    '{ mode:"tables", tables:[{ schema, name, columnCount }], total, page, pageSize, totalPages }. ' +
    'NÃO traz colunas. Use `search` (substring do nome, case-insensitive), `schema` (ex.: "public") ' +
    'e `page`/`pageSize` para filtrar/paginar essa lista. ' +
    'PASSO 2: depois de escolher as tabelas relevantes, chame DE NOVO passando ' +
    '`tables: ["schema.tabela", ...]` (aceita "schema.tabela" ou só "tabela") para obter as COLUNAS ' +
    'SÓ dessas tabelas: { mode:"columns", tables:[{ schema, name, columns:[{ name, dataType, nullable }] }], notFound }. ' +
    'NUNCA tente obter as colunas de TODAS as tabelas de uma vez em bancos grandes — filtre com ' +
    '`search`/`schema`/`tables`. Se a resposta vier com `truncated:true`, leia o `hint` e refine. ' +
    'Use `refresh:true` para ignorar o cache.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['connectionId'],
    properties: {
      connectionId: { type: 'string', description: 'Id da conexão (de list_connections).' },
      tables: {
        type: 'array',
        items: { type: 'string' },
        description:
          'PASSO 2: nomes das tabelas cujas COLUNAS você quer ("schema.tabela" ou só "tabela"). ' +
          'Omita para receber apenas a LISTA de tabelas (passo 1).',
      },
      search: {
        type: 'string',
        description: 'Filtra a lista de tabelas por substring do nome (case-insensitive).',
      },
      schema: {
        type: 'string',
        description: 'Filtra por schema do Postgres (ex.: "public").',
      },
      page: { type: 'integer', minimum: 1, default: 1, description: 'Página da lista de tabelas.' },
      pageSize: {
        type: 'integer',
        minimum: 1,
        maximum: SCHEMA_TABLES_PAGE_SIZE_MAX,
        default: SCHEMA_TABLES_PAGE_SIZE_DEFAULT,
        description: 'Tamanho da página da lista de tabelas.',
      },
      refresh: { type: 'boolean', description: 'Ignora o cache e reintrospecta.' },
    },
  },
  handler: async (rawArgs, { actor }) => {
    const { connectionId, tables, search, schema, page, pageSize, refresh } = schemaArgs.parse(
      rawArgs ?? {},
    );
    const conn = await requireConnectionForUse(connectionId, actor);

    let full;
    try {
      full = await introspectSchema(conn, { refresh });
    } catch (err) {
      if (err instanceof SqlGuardError || err instanceof PgRunnerError) {
        throw new McpToolError(err.message, 'introspection_failed');
      }
      throw err;
    }

    const base = {
      connectionId: full.connectionId,
      cached: full.cached,
      fetchedAt: full.fetchedAt,
      tableCount: full.tableCount,
    };

    // Filtros comuns (schema/search) aplicados sobre o resultado introspectado.
    let filtered = full.tables;
    if (schema) {
      const s = schema.trim().toLowerCase();
      filtered = filtered.filter((t) => t.schema.toLowerCase() === s);
    }
    if (search) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
    }

    // --- PASSO 2: colunas só das tabelas pedidas -----------------------------
    if (tables && tables.length > 0) {
      const matched: typeof full.tables = [];
      const seen = new Set<string>();
      const notFound: string[] = [];
      for (const requested of tables) {
        const hits = filtered.filter((t) => tableMatches(t, requested));
        if (hits.length === 0) {
          notFound.push(requested);
          continue;
        }
        for (const t of hits) {
          const key = `${t.schema}.${t.name}`;
          if (!seen.has(key)) {
            seen.add(key);
            matched.push(t);
          }
        }
      }

      // Cap defensivo: nº de tabelas detalhadas e nº total de colunas.
      const projected: typeof full.tables = [];
      let totalColumns = 0;
      let truncated = false;
      for (const t of matched) {
        if (projected.length >= SCHEMA_MAX_DETAILED_TABLES) {
          truncated = true;
          break;
        }
        if (totalColumns + t.columns.length > SCHEMA_MAX_TOTAL_COLUMNS && projected.length > 0) {
          truncated = true;
          break;
        }
        projected.push(t);
        totalColumns += t.columns.length;
      }

      return {
        ...base,
        mode: 'columns' as const,
        tables: projected,
        returnedTables: projected.length,
        totalColumns,
        ...(notFound.length > 0 ? { notFound } : {}),
        ...(truncated
          ? {
              truncated: true,
              hint:
                `Retornei só ${projected.length} de ${matched.length} tabelas pedidas (cap de ` +
                `${SCHEMA_MAX_DETAILED_TABLES} tabelas / ${SCHEMA_MAX_TOTAL_COLUMNS} colunas por ` +
                'chamada). Peça menos tabelas por vez.',
            }
          : {}),
      };
    }

    // --- PASSO 1: lista de tabelas (SEM colunas), paginada -------------------
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);
    const truncated = total > pageSize;

    return {
      ...base,
      mode: 'tables' as const,
      tables: pageItems.map((t) => ({
        schema: t.schema,
        name: t.name,
        columnCount: t.columns.length,
      })),
      total,
      page,
      pageSize,
      totalPages,
      ...(truncated
        ? {
            truncated: true,
            hint:
              `Mostrando ${pageItems.length} de ${total} tabelas (página ${page}/${totalPages}). ` +
              'Refine com `search`/`schema` ou navegue com `page`. Para ver COLUNAS, chame de novo ' +
              'com `tables: ["schema.tabela", ...]` só das tabelas que vai usar.',
          }
        : {}),
    };
  },
};

// --- run_query --------------------------------------------------------------

/**
 * Limites de PREVIEW do MCP para `run_query` — bem menores que o cap do
 * pg-runner. O agente externo usa isto para INSPECIONAR dados antes de criar um
 * chart; despejar dezenas de milhares de linhas no contexto da IA é justamente o
 * que queremos evitar. O pg-runner ainda clampa pelo env (defesa em profundidade).
 */
const MCP_RUN_QUERY_DEFAULT_ROWS = 50;
const MCP_RUN_QUERY_MAX_ROWS = 1000;

const runQueryArgs = z.object({
  connectionId: z.string().min(1),
  sql: z.string().min(1),
  params: z.array(z.unknown()).optional(),
  maxRows: z.number().int().min(1).max(MCP_RUN_QUERY_MAX_ROWS).default(MCP_RUN_QUERY_DEFAULT_ROWS),
});

const runQueryTool: ToolDefinition = {
  name: 'run_query',
  description:
    'Executa uma query SOMENTE-LEITURA (SELECT/WITH) contra a conexão para inspecionar ' +
    'dados ANTES de criar um gráfico — é um PREVIEW, não persiste nada. ' +
    `Limitado a ${MCP_RUN_QUERY_DEFAULT_ROWS} linhas por padrão para não despejar datasets ` +
    `grandes no seu contexto; aumente com \`maxRows\` (até ${MCP_RUN_QUERY_MAX_ROWS}) se precisar ` +
    'de mais, mas evite trazer datasets grandes — prefira agregar no SQL (GROUP BY/LIMIT). ' +
    'Guardrails: apenas SELECT/WITH (INSERT/UPDATE/DELETE/DDL e múltiplos statements são ' +
    'REJEITADOS), statement_timeout e teto de linhas. Use placeholders parametrizados ($1, $2) ' +
    'com `params`. Retorna { columns: [{ name, dataTypeID }], rows, rowCount, truncated, ' +
    'durationMs }. `truncated: true` significa que o resultado bateu no teto de linhas.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['connectionId', 'sql'],
    properties: {
      connectionId: { type: 'string', description: 'Id da conexão (de list_connections).' },
      sql: {
        type: 'string',
        description: 'Query read-only (SELECT/WITH). Use $1,$2,... para parâmetros.',
      },
      params: {
        type: 'array',
        items: {},
        description: 'Valores posicionais para os placeholders $1..$n.',
      },
      maxRows: {
        type: 'integer',
        minimum: 1,
        maximum: MCP_RUN_QUERY_MAX_ROWS,
        default: MCP_RUN_QUERY_DEFAULT_ROWS,
        description:
          `Teto de linhas do preview (default ${MCP_RUN_QUERY_DEFAULT_ROWS}, máx ` +
          `${MCP_RUN_QUERY_MAX_ROWS}). Evite valores altos — é um preview pra IA.`,
      },
    },
  },
  handler: async (rawArgs, { actor }) => {
    const { connectionId, sql, params, maxRows } = runQueryArgs.parse(rawArgs ?? {});
    const conn = await requireConnectionForUse(connectionId, actor);
    try {
      return await runConnectionQuery(conn, sql, params, maxRows);
    } catch (err) {
      // Guardrail violado / falha de execução → erro de tool (sem vazar segredo).
      if (err instanceof SqlGuardError) {
        throw new McpToolError(err.message, 'read_only_violation');
      }
      if (err instanceof PgRunnerError) {
        throw new McpToolError(err.message, 'query_failed');
      }
      throw err;
    }
  },
};

export const connectionTools: ToolDefinition[] = [
  listConnectionsTool,
  getConnectionSchemaTool,
  runQueryTool,
];
