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
  // O handler do MCP valida os args com Zod internamente (cada tool tem seu
  // schemaArgs), então aqui só precisamos de um schema PERMISSIVO que aceite
  // qualquer payload do LLM. NÃO use `z.any()`: ele serializa para
  // `{"anyOf":[{"not":{}},{}]}` (SEM `type`), e a API Anthropic REJEITA tools
  // cujo `input_schema` não tem `type: "object"` — erro
  // `tools.0.custom.input_schema.type: Field required` (quebra o chat inteiro).
  // `z.object({}).passthrough()` serializa para
  // `{"type":"object","properties":{},"additionalProperties":true}` —
  // satisfaz o requisito da Anthropic E mantém os args intactos (passthrough)
  // para o handler validar.
  return z.object({}).passthrough();
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
 * Percorre o `inputSchema` de uma tool e devolve a lista de paths RELATIVOS
 * a `args` que DEVEM ser escalares JSON Schema `integer`, `number` ou
 * `boolean`. Suporta sub-objetos aninhados (recursivo, mas NÃO recursa em
 * $ref). Não inclui a raiz `[]` (a raiz é o próprio `args`).
 *
 * Para `add_chart_to_dashboard` devolve `[['span'], ['position']]` (integers).
 * Para `run_query` devolve `[['maxRows']]` (integer).
 * Não inclui `ttlSeconds` aqui porque ele vive em `draftDataBinding` (e o
 * percorrimento aninhado vai descer e achá-lo). Strings normais, enums e
 * arrays NÃO entram — só os tipos primitivos numéricos/booleanos.
 *
 * Exportada para teste unitário.
 */
export function collectScalarPaths(
  schema: Record<string, unknown> | undefined,
  prefix: string[] = [],
): string[][] {
  if (!schema || typeof schema !== 'object') return [];
  const out: string[][] = [];

  // Se ESTE nó declara um tipo escalar, ele É um path terminal.
  // (Mas só conta quando prefix.length > 0 — a raiz `[]` é o args inteiro,
  // não é um campo escalar.)
  if (prefix.length > 0) {
    if (
      schema.type === 'integer' ||
      schema.type === 'number' ||
      schema.type === 'boolean'
    ) {
      out.push(prefix);
      return out;
    }
  }

  const properties = schema.properties as Record<string, unknown> | undefined;
  if (properties && typeof properties === 'object') {
    for (const [key, propSchema] of Object.entries(properties)) {
      if (!propSchema || typeof propSchema !== 'object') continue;
      if ('$ref' in (propSchema as Record<string, unknown>)) continue;
      const sub = collectScalarPaths(propSchema as Record<string, unknown>, [
        ...prefix,
        key,
      ]);
      out.push(...sub);
    }
  }
  return out;
}

/**
 * Tenta coercer uma STRING para um valor escalar nativo (`number` ou
 * `boolean`). Devolve:
 *   - `true` / `false` para `"true"` / `"false"` (case-insensitive, trim)
 *   - `Number` parseado se for um número válido (inclui "4", "4.5", "-1")
 *   - `undefined` se a string não é coercível (vazia, "abc", etc.) — nesse
 *     caso o caller deve PRESERVAR a string original (não substituir por
 *     `undefined`) pra Zod poder emitir uma mensagem de erro útil.
 *
 * IMPORTANTE: não distingue `integer` vs `number` — sempre devolve `Number`.
 * Se o tipo esperado era `integer` mas o valor veio como "4.5", Zod vai
 * validar que é inteiro depois (aqui só fazemos a coerção ampla).
 */
function coerceScalar(raw: string): boolean | number | undefined {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;

  // Boolean — case-insensitive (LLMs podem emitir "True", "FALSE", etc.)
  const lower = trimmed.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;

  // Number — usa Number() (aceita inteiros, decimais, negativos, notação
  // científica). String vazia já foi tratada acima; "abc" → NaN → undefined.
  const n = Number(trimmed);
  if (!Number.isNaN(n) && Number.isFinite(n)) return n;

  return undefined;
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
 * esperados do schema da tool, E COERCE strings em paths integer/number/
 * boolean esperados do schema. MUTA o objeto (é criado dentro da função
 * de cima).
 *
 * Quatro casos que o Claude às vezes emite para arrays/objetos (reproduzido
 * em produção via SSE — ver `_meta/agent-e2e/test-vazio.stream`):
 *   1. `args.draftLayout.filters = ""` → vira `[]`
 *   2. `args.draftLayout.rows = ""`    → vira `[]`
 *   3. `args.draftLayout = "{\"filters\":[],\"rows\":[]}"` → vira objeto
 *   4. (legado do T4) `args.draftLayout.rows = {item: [...]}` → vira array
 *
 * E o caso novo (T10) que o Claude emite para escalares numéricos/booleanos
 * (reproduzido em `_meta/agent-e2e/test-sequencial.stream`):
 *   5. `args.span = "4"`              → vira `4` (number)
 *   6. `args.position = "2"`          → vira `2` (number)
 *   7. `args.showDelta = "true"`      → vira `true` (boolean, case-insens.)
 *   8. `args.showDelta = "False"`     → vira `false` (boolean)
 *
 * A transformação SÓ roda em paths que o schema declara como
 * array/object/integer/number/boolean — `title`, `connectionId`, etc.
 * (strings esperadas como string) são intocados.
 *
 * Ordem: processa `objectPaths` ANTES de `arrayPaths` para que, se um objeto
 * pai virou `{}` ou objeto parseado, os arrays filhos sejam encontrados.
 * `scalarPaths` roda por ÚLTIMO (não cria estrutura nova — só mexe em
 * valores já presentes).
 *
 * Importante: a coerção escalar NÃO substitui a string por `undefined`
 * quando a string não é coercível (vazia, "abc"). Ela simplesmente NÃO
 * toca — preserva a string. Razão: deixar o Zod emitir "Expected number,
 * received string" com mensagem útil em vez de silenciosamente quebrar a
 * forma do payload.
 *
 * Exportada para teste unitário.
 */
export function unwrapArrayWrappers(
  args: Record<string, unknown>,
  arrayPaths: string[][],
  objectPaths: string[][] = [],
  scalarPaths: string[][] = [],
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

  // 3) Coerce strings em paths integer/number/boolean.
  //    Se o LLM mandou `span: "4"` em vez de `span: 4`, transforma em número.
  //    Strings não-coercíveis ("abc", "") são preservadas — Zod vai rejeitar
  //    com mensagem útil em vez de silenciosamente virar undefined.
  for (const path of scalarPaths) {
    const node = getNodeAt(args, path);
    if (typeof node !== 'string') continue;
    const coerced = coerceScalar(node);
    if (coerced !== undefined) {
      setNodeAt(args, path, coerced);
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
  // Coleta também os paths objeto-esperados (T9: draftLayout, draftDataBinding
  // etc. podem chegar como string JSON do LLM).
  const objectPaths = collectObjectPaths(mcpTool.inputSchema);
  // E os paths escalar-esperados (T10: span, position, showDelta, maxRows,
  // ttlSeconds etc. podem chegar como string em vez de number/boolean).
  const scalarPaths = collectScalarPaths(mcpTool.inputSchema);

  return tool({
    description: mcpTool.description,
    inputSchema: jsonSchemaToZodRaw(mcpTool.inputSchema),
    execute: async (args: unknown) => {
      try {
        // Normalização defensiva: desempacota {item:T} → T nos campos array
        // esperados do schema da tool, strings (vazias ou JSON) em campos
        // array/objeto esperados, e coage strings em campos
        // integer/number/boolean esperados. Se o input já é o tipo nativo ou
        // está ausente, não mexe. Não toca em outros campos.
        const safeArgs =
          args !== null && typeof args === 'object' && !Array.isArray(args)
            ? unwrapArrayWrappers(
                args as Record<string, unknown>,
                arrayPaths,
                objectPaths,
                scalarPaths,
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