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

import { tool, type Tool } from 'ai';
import { z } from 'zod';
import { TOOLS } from '@/modules/mcp/tools';
import type { ToolDefinition } from '@/modules/mcp/tools/types';
import type { ActorContext } from '@/lib/rbac';

/**
 * JSON Schema → Zod schema (simplificado para os casos do MCP).
 * As tools do MCP já têm inputSchema em JSON Schema. O AI SDK aceita inputSchema
 * como Zod OU como JSON Schema cru — passamos o JSON Schema direto via `schema`.
 */
function jsonSchemaToZodRaw(_inputSchema: Record<string, unknown>): z.ZodTypeAny {
  // O AI SDK v6 aceita que passemos o JSON Schema diretamente no `schema` do tool().
  // Mas como tool() espera Zod, usamos z.any() e validamos no handler.
  // O handler do MCP já valida com Zod internamente (cada tool tem seu schemaArgs).
  return z.any().optional();
}

/**
 * Heurística: o campo `value` parece um `{item: T}` (wrapper que o LLM às
 * vezes inventa no lugar de um array)? Aceitamos `T[]` (forma canônica) ou
 * `{item: T[]}` (forma "empacotada") sem distinguir.
 *
 * Por que tolerar isso? Em produção o LLM (Claude) às vezes emite
 * `tables: { item: ["x"] }` no lugar de `tables: ["x"]`. A causa exata é
 * instabilidade de modelo — nem o AI SDK nem o MCP server WRAPPAM arrays
 * (verificado em `node_modules/ai/dist/index.mjs` e
 * `backend-boilerplate/src/modules/mcp/tools/*.ts`). O Zod dos handlers
 * (que esperam array) rejeita a forma empacotada e o agent perde 2-3 turnos
 * para descobrir o formato. Esta camada DEFENSIVA normaliza antes da
 * validação, em TODOS os campos array-esperados do JSON schema da tool.
 *
 * Implementação: olhamos `inputSchema.properties` da tool, identificamos
 * campos `type: 'array'` (top-level OU aninhados em sub-objetos como
 * `draftDataBinding`/`draftLayout`) e desempacotamos `{item: T}` → `T`
 * nesses paths. Não usamos heurística genérica de "se tem só 'item' é
 * wrapper" porque isso quebraria objetos legítimos com um campo `item`
 * (ex.: um filter `{field:'item', op:'='}`).
 *
 * Exportada para teste unitário.
 */
export function looksLikeItemWrapper(value: unknown): value is { item: unknown } {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  // Tem EXATAMENTE a chave `item` e nenhuma outra? Wrapper provável.
  const keys = Object.keys(value as Record<string, unknown>);
  return keys.length === 1 && keys[0] === 'item';
}

/**
 * Percorre o `inputSchema` de uma tool e devolve a lista de paths RELATIVOS
 * a `args` que DEVEM ser arrays. Suporta sub-objetos aninhados (recursivo,
 * mas NÃO recursa em $ref). Ex.: para `create_chart` devolve:
 *   [['draftDataBinding', 'params']]
 * Para `create_dashboard` devolve:
 *   [['draftLayout', 'filters'], ['draftLayout', 'rows']]
 * Para `get_connection_schema` devolve:
 *   [['tables']]
 *
 * Exportada para teste unitário.
 */
export function collectArrayPaths(
  schema: Record<string, unknown> | undefined,
  prefix: string[] = [],
): string[][] {
  if (!schema || typeof schema !== 'object') return [];
  const out: string[][] = [];

  if (schema.type === 'array') {
    out.push(prefix);
    // Não desce nos `items` — só nos interessa o nó array em si.
    return out;
  }

  const properties = schema.properties as Record<string, unknown> | undefined;
  if (properties && typeof properties === 'object') {
    for (const [key, propSchema] of Object.entries(properties)) {
      if (!propSchema || typeof propSchema !== 'object') continue;
      // pula refs — sem resolver $ref, não sabemos se é array/objeto.
      // Para os schemas atuais do MCP isso nunca acontece (sem $ref).
      if ('$ref' in (propSchema as Record<string, unknown>)) continue;
      const sub = collectArrayPaths(propSchema as Record<string, unknown>, [...prefix, key]);
      out.push(...sub);
    }
  }
  return out;
}

/**
 * Aplica `unwrapItemWrapper` em todos os paths array-esperados do `args`,
 * respeitando o `inputSchema` da tool. MUTA o objeto (é criado dentro da
 * função de cima).
 *
 * Exportada para teste unitário.
 */
export function unwrapArrayWrappers(
  args: Record<string, unknown>,
  arrayPaths: string[][],
): Record<string, unknown> {
  for (const path of arrayPaths) {
    let cursor: Record<string, unknown> | undefined = args;
    for (let i = 0; i < path.length - 1; i++) {
      const next = cursor?.[path[i]!];
      if (!next || typeof next !== 'object' || Array.isArray(next)) {
        cursor = undefined;
        break;
      }
      cursor = next as Record<string, unknown>;
    }
    if (!cursor) continue;
    const leafKey = path[path.length - 1]!;
    const leaf = cursor[leafKey];
    if (Array.isArray(leaf)) continue; // já é array
    if (looksLikeItemWrapper(leaf)) {
      cursor[leafKey] = (leaf as { item: unknown }).item;
    }
  }
  return args;
}

/**
 * Converte uma ToolDefinition do MCP numa tool() do AI SDK.
 */
function convertMcpTool(mcpTool: ToolDefinition, actor: ActorContext): Tool {
  // Coleta os paths array-esperados UMA VEZ por tool (inputSchema é estático).
  const arrayPaths = collectArrayPaths(mcpTool.inputSchema);

  return tool({
    description: mcpTool.description,
    inputSchema: jsonSchemaToZodRaw(mcpTool.inputSchema),
    execute: async (args: unknown) => {
      try {
        // Normalização defensiva: desempacota {item:T} → T nos campos array
        // esperados do schema da tool. Se o input já é array ou está ausente,
        // não mexe. Não toca em outros campos.
        const safeArgs =
          args !== null && typeof args === 'object' && !Array.isArray(args)
            ? unwrapArrayWrappers(args as Record<string, unknown>, arrayPaths)
            : (args ?? {});
        const result = await mcpTool.handler(safeArgs, { actor });
        return result;
      } catch (err: unknown) {
        // Erros do MCP já são estruturados. Retornamos como { error } para o agent.
        const e = err as { message?: string; code?: string; detail?: unknown };
        return {
          error: e.message ?? 'Tool execution failed',
          code: e.code ?? 'internal_error',
          ...(e.detail ? { detail: e.detail } : {}),
        };
      }
    },
  });
}

/**
 * Constrói todas as tools do AI SDK a partir das tools do MCP.
 */
export function buildMcpToolsForAgent(actor: ActorContext): Record<string, Tool> {
  const tools: Record<string, Tool> = {};
  for (const mcpTool of TOOLS) {
    tools[mcpTool.name] = convertMcpTool(mcpTool, actor);
  }
  return tools;
}