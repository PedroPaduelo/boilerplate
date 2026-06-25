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
 * Percorre o `inputSchema` de uma tool e devolve a lista de paths RELATIVOS
 * a `args` que DEVEM ser OBJETOS (não arrays, não strings). NÃO inclui a
 * raiz `[]` — a raiz é o próprio `args`, que o handler já trata. Suporta
 * sub-objetos aninhados (recursivo, mas NÃO recursa em $ref).
 *
 * Para `create_dashboard` devolve:
 *   [['draftLayout']]
 * (porque `draftLayout` é `{type:'object', properties:{filters,rows}}`)
 *
 * Para `create_chart` devolve:
 *   [['draftDataBinding']] (porque draftDataBinding é `type:'object'`)
 *
 * Exportada para teste unitário.
 */
export function collectObjectPaths(
  schema: Record<string, unknown> | undefined,
  prefix: string[] = [],
): string[][] {
  if (!schema || typeof schema !== 'object') return [];
  const out: string[][] = [];

  const properties = schema.properties as Record<string, unknown> | undefined;
  if (properties && typeof properties === 'object') {
    for (const [key, propSchema] of Object.entries(properties)) {
      if (!propSchema || typeof propSchema !== 'object') continue;
      if ('$ref' in (propSchema as Record<string, unknown>)) continue;
      const subPrefix = [...prefix, key];
      const sub = propSchema as Record<string, unknown>;
      // Conta este nó como path de objeto se o schema declarar `type: 'object'`
      // E não for declarado como array.
      if (sub.type === 'object') {
        out.push(subPrefix);
      }
      // Recursa — pode ter sub-objetos mais profundos.
      const deeper = collectObjectPaths(sub, subPrefix);
      out.push(...deeper);
    }
  }
  return out;
}

/**
 * Navega `obj` seguindo `path` e devolve o nó final. Devolve `undefined` se
 * algum segmento não puder ser percorrido (sub-objeto ausente, primitivo,
 * array). NÃO cria novos objetos — só leitura.
 */
function getNodeAt(obj: Record<string, unknown>, path: string[]): unknown {
  let cursor: unknown = obj;
  for (const key of path) {
    if (cursor === null || typeof cursor !== 'object' || Array.isArray(cursor)) {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

/**
 * Navega `obj` seguindo `path` (exceto o último segmento) criando sub-objetos
 * plain (`{}`) conforme necessário, e seta o valor final em `leafKey`. Se o
 * pai for null/array/primitivo no meio do caminho, devolve `false` sem mexer.
 */
function setNodeAt(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): boolean {
  let cursor: Record<string, unknown> = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    const next = cursor[key];
    if (next === null || next === undefined) {
      cursor[key] = {};
      cursor = cursor[key] as Record<string, unknown>;
    } else if (typeof next === 'object' && !Array.isArray(next)) {
      cursor = next as Record<string, unknown>;
    } else {
      // Sub-caminho passa por um primitivo ou array — não dá pra navegar.
      return false;
    }
  }
  cursor[path[path.length - 1]!] = value;
  return true;
}

/**
 * Tenta parsear uma string como JSON e devolver um valor que SATISFAÇA o
 * predicado `expectedKind` (`'array'` ou `'object'`). Em falha (string vazia
 * já tratada fora; string não-JSON; JSON inválido; JSON parseado mas do tipo
 * errado), devolve `null` para o caller decidir se cai pra fallback.
 *
 * Para `expectedKind: 'array'`: aceita `[...]` (resultado array) OU
 * `null`/string vazia → tratado pelo caller.
 * Para `expectedKind: 'object'`: aceita `{...}` (resultado objeto não-array).
 */
function tryParseJsonOfKind(
  raw: string,
  expectedKind: 'array' | 'object',
): unknown | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null; // caller decide (vira [])
  // Heurística rápida: pula se não começa com o bracket certo.
  if (expectedKind === 'array' && !trimmed.startsWith('[')) return null;
  if (expectedKind === 'object' && !trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (expectedKind === 'array' && Array.isArray(parsed)) return parsed;
    if (
      expectedKind === 'object' &&
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Aplica `unwrapItemWrapper` em todos os paths array-esperados do `args`,
 * E desempacota strings (`""` ou JSON serializado) em paths array/objeto
 * esperados do schema da tool. MUTA o objeto (é criado dentro da função
 * de cima).
 *
 * Quatro casos que o Claude às vezes emite (reproduzido em produção via SSE
 * — ver `_meta/agent-e2e/test-vazio.stream`):
 *   1. `args.draftLayout.filters = ""` → vira `[]`
 *   2. `args.draftLayout.rows = ""`    → vira `[]`
 *   3. `args.draftLayout = "{\"filters\":[],\"rows\":[]}"` → vira objeto
 *   4. (legado do T4) `args.draftLayout.rows = {item: [...]}` → vira array
 *
 * A transformação SÓ roda em paths que o schema declara como array/objeto —
 * `title`, `connectionId`, etc. (strings esperadas como string) são intocados.
 *
 * Ordem: processa `objectPaths` ANTES de `arrayPaths` para que, se um objeto
 * pai virou `{}` ou objeto parseado, os arrays filhos sejam encontrados.
 *
 * Exportada para teste unitário.
 */
export function unwrapArrayWrappers(
  args: Record<string, unknown>,
  arrayPaths: string[][],
  objectPaths: string[][] = [],
): Record<string, unknown> {
  // 1) Desempacota strings em paths de objeto:
  //    "" → {} (defensivo, embora Zod ainda rejeite — não piora o estado)
  //    "{...}" → parse para objeto (se resultado for objeto não-array)
  for (const path of objectPaths) {
    const node = getNodeAt(args, path);
    if (typeof node !== 'string') continue;
    if (node.trim() === '') {
      setNodeAt(args, path, {});
      continue;
    }
    const parsed = tryParseJsonOfKind(node, 'object');
    if (parsed !== null) {
      setNodeAt(args, path, parsed);
    }
  }

  // 2) Desempacota strings em paths de array + wrapper {item: T} legado.
  for (const path of arrayPaths) {
    const node = getNodeAt(args, path);
    if (typeof node === 'string') {
      // "" → []
      if (node.trim() === '') {
        setNodeAt(args, path, []);
        continue;
      }
      // "[...]" ou "{...}" → parse (casa se virar array)
      const parsed = tryParseJsonOfKind(node, 'array');
      if (parsed !== null && Array.isArray(parsed)) {
        setNodeAt(args, path, parsed);
      }
      continue;
    }
    // Wrapper {item: T} legado (T4)
    if (
      node !== null &&
      typeof node === 'object' &&
      !Array.isArray(node) &&
      looksLikeItemWrapper(node)
    ) {
      setNodeAt(args, path, (node as { item: unknown }).item);
    }
    // else: já é array, ou outro tipo → não toca
  }
  return args;
}

/**
 * Converte uma ToolDefinition do MCP numa tool() do AI SDK.
 */
function convertMcpTool(mcpTool: ToolDefinition, actor: ActorContext): Tool {
  // Coleta os paths array-esperados UMA VEZ por tool (inputSchema é estático).
  const arrayPaths = collectArrayPaths(mcpTool.inputSchema);
  // Coleta também os paths objeto-esperados (T9: draftLayout, draftDataBinding
  // etc. podem chegar como string JSON do LLM).
  const objectPaths = collectObjectPaths(mcpTool.inputSchema);

  return tool({
    description: mcpTool.description,
    inputSchema: jsonSchemaToZodRaw(mcpTool.inputSchema),
    execute: async (args: unknown) => {
      try {
        // Normalização defensiva: desempacota {item:T} → T nos campos array
        // esperados do schema da tool, e strings (vazias ou JSON) em campos
        // array/objeto esperados. Se o input já é array ou está ausente,
        // não mexe. Não toca em outros campos.
        const safeArgs =
          args !== null && typeof args === 'object' && !Array.isArray(args)
            ? unwrapArrayWrappers(
                args as Record<string, unknown>,
                arrayPaths,
                objectPaths,
              )
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