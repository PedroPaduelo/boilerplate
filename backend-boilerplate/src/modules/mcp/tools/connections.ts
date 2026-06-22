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

const schemaArgs = z.object({
  connectionId: z.string().min(1),
  refresh: z.boolean().optional(),
});

const getConnectionSchemaTool: ToolDefinition = {
  name: 'get_connection_schema',
  description:
    'Introspecta o schema (tabelas e colunas) de uma conexão para você montar as ' +
    'queries SQL. Passe o `connectionId` (de `list_connections`). Use `refresh: true` para ' +
    'ignorar o cache. Retorna { connectionId, tableCount, fetchedAt, cached, tables: ' +
    '[{ schema, name, columns: [{ name, dataType, nullable }] }] }.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['connectionId'],
    properties: {
      connectionId: { type: 'string', description: 'Id da conexão (de list_connections).' },
      refresh: { type: 'boolean', description: 'Ignora o cache e reintrospecta.' },
    },
  },
  handler: async (rawArgs, { actor }) => {
    const { connectionId, refresh } = schemaArgs.parse(rawArgs ?? {});
    const conn = await requireConnectionForUse(connectionId, actor);
    try {
      return await introspectSchema(conn, { refresh });
    } catch (err) {
      if (err instanceof SqlGuardError || err instanceof PgRunnerError) {
        throw new McpToolError(err.message, 'introspection_failed');
      }
      throw err;
    }
  },
};

// --- run_query --------------------------------------------------------------

const runQueryArgs = z.object({
  connectionId: z.string().min(1),
  sql: z.string().min(1),
  params: z.array(z.unknown()).optional(),
  maxRows: z.number().int().min(1).max(100000).optional(),
});

const runQueryTool: ToolDefinition = {
  name: 'run_query',
  description:
    'Executa uma query SOMENTE-LEITURA (SELECT/WITH) contra a conexão para inspecionar ' +
    'dados ANTES de criar um gráfico — é um preview, não persiste nada. Guardrails: apenas ' +
    'SELECT/WITH (INSERT/UPDATE/DELETE/DDL e múltiplos statements são REJEITADOS), ' +
    'statement_timeout e teto de linhas (row cap). Use placeholders parametrizados ($1, $2) ' +
    'com `params`. Retorna { columns: [{ name, dataTypeID }], rows, rowCount, truncated, ' +
    'durationMs }. `truncated: true` significa que o resultado bateu no row cap.',
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
        maximum: 100000,
        description: 'Teto de linhas pedido (limitado pelo cap de segurança do servidor).',
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
