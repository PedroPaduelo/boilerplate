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
import { BadRequestError } from '@/http/routes/_errors';
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
  /**
   * Sub-código OPCIONAL que discrimina a causa quando o `code` é genérico
   * (ex.: code='bad_request' + detail='unknown_catalog_type'). A camada de
   * protocolo propaga `detail` no objeto de erro do resultado da tool, para a
   * IA distinguir programaticamente o motivo SEM ter que parsear a `message`.
   */
  detail?: string;
  constructor(message: string, code = 'tool_error', detail?: string) {
    super(message);
    this.name = 'McpToolError';
    this.code = code;
    this.detail = detail;
  }
}

/**
 * Regra de enriquecimento de um `BadRequestError` (genérico) vindo de um SERVICE
 * de domínio. `match` casa contra a mensagem do erro; `detail` é o sub-código
 * acionável; `hint` é o "como corrigir" anexado à mensagem (SEM engolir a
 * mensagem original do validador — props/layout AJV continuam visíveis).
 */
export interface AiErrorRule {
  match: RegExp;
  detail: string;
  hint: string;
}

/**
 * Converte um erro de DOMÍNIO num erro AUTOEXPLICATIVO para a IA.
 *
 * Os services do projeto (compartilhados com as rotas REST) lançam
 * `BadRequestError` com mensagem técnica e UM ÚNICO `code` genérico
 * (`bad_request`). Para a IA agir sem ambiguidade, este helper:
 *   1. detecta a causa pela mensagem (regras estáveis dos services);
 *   2. anexa um `detail` (sub-código) — ex.: `unknown_catalog_type`,
 *      `invalid_props`, `unknown_connection`, `missing_department`;
 *   3. acrescenta um "como corrigir" à mensagem (sem descartar o detalhe do
 *      validador, ex.: caminhos JSON do AJV).
 *
 * `BadRequestError` sem regra → continua `bad_request` (mensagem preservada).
 * Qualquer outro erro (NotFound/Forbidden/Zod/...) é REPROPAGADO sem alteração
 * (a camada de protocolo já os mapeia para `not_found`/`forbidden`/...).
 *
 * Sempre lança (retorno `never`): use em `catch (e) { throw enrichBadRequest(e, RULES); }`.
 */
export function enrichBadRequest(error: unknown, rules: AiErrorRule[]): never {
  if (error instanceof BadRequestError) {
    for (const rule of rules) {
      if (rule.match.test(error.message)) {
        throw new McpToolError(`${error.message} — ${rule.hint}`, 'bad_request', rule.detail);
      }
    }
    throw new McpToolError(error.message, 'bad_request');
  }
  throw error;
}
