/**
 * Adapter: converte as ToolDefinition do MCP em tools() do AI SDK (Vercel AI SDK v6).
 *
 * O agent não chama o MCP via HTTP loopback — ele invoca os HANDLERS diretamente,
 * no mesmo processo, passando o ActorContext do usuário autenticado.
 *
 * Isso dá ao agent TODAS as tools do MCP (list_connections, get_connection_schema,
 * run_query, list_catalog, create_chart, update_chart, publish_chart, preview_chart_data,
 * create_dashboard, update_dashboard, add_chart_to_dashboard, publish_dashboard)
 * sem reimplementar nada.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { TOOLS } from '@/modules/mcp/tools';
import type { ToolDefinition } from '@/modules/mcp/tools/types';
import type { ActorContext } from '@/lib/rbac';

/**
 * JSON Schema → Zod schema (simplificado para os casos do MCP).
 * As tools do MCP já têm inputSchema em JSON Schema. O AI SDK aceita inputSchema
 * como Zod OU como JSON Schema cru — passamos o JSON Schema direto via `schema`.
 */
function jsonSchemaToZodRaw(inputSchema: Record<string, unknown>): z.ZodTypeAny {
  // O AI SDK v6 aceita que passemos o JSON Schema diretamente no `schema` do tool().
  // Mas como tool() espera Zod, usamos z.any() e validamos no handler.
  // O handler do MCP já valida com Zod internamente (cada tool tem seu schemaArgs).
  return z.any().optional();
}

/**
 * Converte uma ToolDefinition do MCP numa tool() do AI SDK.
 */
function convertMcpTool(mcpTool: ToolDefinition, actor: ActorContext) {
  return tool({
    description: mcpTool.description,
    inputSchema: jsonSchemaToZodRaw(mcpTool.inputSchema),
    execute: async (args: unknown) => {
      try {
        const result = await mcpTool.handler(args ?? {}, { actor });
        return result;
      } catch (err: any) {
        // Erros do MCP já são estruturados. Retornamos como { error } para o agent.
        return {
          error: err.message ?? 'Tool execution failed',
          code: err.code ?? 'internal_error',
          ...(err.detail ? { detail: err.detail } : {}),
        };
      }
    },
  });
}

/**
 * Constrói todas as tools do AI SDK a partir das tools do MCP.
 */
export function buildMcpToolsForAgent(actor: ActorContext): Record<string, any> {
  const tools: Record<string, any> = {};
  for (const mcpTool of TOOLS) {
    tools[mcpTool.name] = convertMcpTool(mcpTool, actor);
  }
  return tools;
}
