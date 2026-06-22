/**
 * Tipos do registro de TOOLS do MCP (T-D).
 *
 * Cada tool é uma unidade autossuficiente: nome, DESCRIÇÃO (lida pela IA — é o
 * contrato semântico mais importante), `inputSchema` (JSON Schema anunciado em
 * `tools/list`) e um `handler` que recebe os argumentos + o ator de serviço e
 * delega ao SERVICE do módulo correspondente (sem reimplementar regra).
 *
 * O `handler` PODE lançar:
 *   - `BadRequestError`/`ForbiddenError`/`NotFoundError` (dos services) ou `ZodError`
 *     (validação de argumentos) → a camada de protocolo converte em um RESULTADO
 *     de tool com `isError: true` (convenção MCP: erro de execução de tool vai no
 *     resultado, não como erro de protocolo JSON-RPC).
 */
import type { ActorContext } from '@/lib/rbac';

/** Contexto de execução de uma tool (o ator de serviço já resolvido). */
export interface McpToolContext {
  actor: ActorContext;
}

/** Resultado estruturado de uma tool (serializado em JSON no content do MCP). */
export type McpToolResult = unknown;

/** Definição de uma tool exposta pelo MCP. */
export interface ToolDefinition {
  /** Nome único da tool (snake_case, como o agente a invoca). */
  name: string;
  /** Descrição PRA IA — explica o que faz, quando usar e o shape de retorno. */
  description: string;
  /** JSON Schema dos argumentos (anunciado em `tools/list`). */
  inputSchema: Record<string, unknown>;
  /** Executa a tool. Recebe os argumentos crus e o contexto (ator). */
  handler: (args: unknown, ctx: McpToolContext) => Promise<McpToolResult>;
}

/**
 * Erro de execução de tool com `code` semântico. Os services do projeto já
 * lançam os erros HTTP-like (`BadRequestError`, ...); este existe para erros
 * específicos do MCP (ex.: tool desconhecida em camada interna).
 */
export class McpToolError extends Error {
  code: string;
  constructor(message: string, code = 'tool_error') {
    super(message);
    this.name = 'McpToolError';
    this.code = code;
  }
}
