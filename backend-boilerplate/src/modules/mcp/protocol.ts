/**
 * Camada de PROTOCOLO do MCP (T-D) — JSON-RPC 2.0 sobre HTTP (Streamable HTTP).
 *
 * O MCP é, no fio, JSON-RPC 2.0. Este módulo implementa o dispatch das mensagens
 * de um servidor de TOOLS (stateless): `initialize`, `ping`, `tools/list`,
 * `tools/call` e as `notifications/*`. Mantivemos a implementação do transporte
 * própria (em vez de puxar o SDK oficial `@modelcontextprotocol/sdk`) para não
 * acoplar o build/tests a um pacote ESM-only nem mexer no wiring de contracts —
 * o PROTOCOLO no fio continua MCP-compliant, e o registro de tools (`./tools`) é
 * portável para o SDK caso um runtime externo exija o transporte oficial.
 *
 * Convenção MCP de erros:
 *   - erro de PROTOCOLO (método inexistente, params inválidos) → erro JSON-RPC;
 *   - erro de EXECUÇÃO de tool (regra de negócio, validação de args) → RESULTADO
 *     normal com `isError: true` e a mensagem no `content` (o agente lê e corrige).
 */
import { ZodError } from 'zod';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/http/routes/_errors';
import type { ActorContext } from '@/lib/rbac';
import { getTool, listToolDescriptors } from './tools';
import { McpToolError } from './tools/types';

/** Versão do protocolo MCP usada como default quando o cliente não a envia. */
export const DEFAULT_PROTOCOL_VERSION = '2025-06-18';

export const SERVER_INFO = {
  name: 'dashboards-mcp',
  version: '1.0.0',
} as const;

// --- tipos JSON-RPC ---------------------------------------------------------

export type JsonRpcId = string | number | null;

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: unknown;
}

export interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result: unknown;
}

export interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  id: JsonRpcId;
  error: { code: number; message: string; data?: unknown };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcErrorResponse;

/** Códigos JSON-RPC padrão. */
export const RPC = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

function ok(id: JsonRpcId, result: unknown): JsonRpcSuccess {
  return { jsonrpc: '2.0', id, result };
}

function err(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcErrorResponse {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

/**
 * Encapsula um valor de tool num resultado MCP (content textual + estruturado).
 *
 * O `content` textual é serializado em JSON COMPACTO (sem indentação) de
 * propósito: o agente externo lê esse texto e a indentação/newlines somam MUITOS
 * tokens em payloads grandes (schema/queries). O `structuredContent` segue o
 * objeto cru (não afeta tokens do canal de texto).
 */
function toolResult(value: unknown, isError = false): Record<string, unknown> {
  return {
    content: [{ type: 'text', text: JSON.stringify(value) }],
    structuredContent: isError ? undefined : value,
    isError,
  };
}

/** Mensagem amigável para o agente a partir de um erro de execução de tool. */
function describeToolError(error: unknown): { code: string; message: string; detail?: string } {
  if (error instanceof ZodError) {
    const message = error.errors
      .map((e) => `${e.path.join('.') || '(root)'}: ${e.message}`)
      .join('; ');
    return { code: 'invalid_arguments', message: `invalid arguments: ${message}` };
  }
  if (error instanceof McpToolError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.detail ? { detail: error.detail } : {}),
    };
  }
  if (error instanceof BadRequestError) return { code: 'bad_request', message: error.message };
  if (error instanceof ForbiddenError) return { code: 'forbidden', message: error.message };
  if (error instanceof NotFoundError) return { code: 'not_found', message: error.message };
  if (error instanceof UnauthorizedError) return { code: 'unauthorized', message: error.message };
  return {
    code: 'internal_error',
    message: error instanceof Error ? error.message : 'tool execution failed',
  };
}

/** É uma mensagem JSON-RPC bem-formada (objeto com jsonrpc/method)? */
function isValidRequest(msg: unknown): msg is JsonRpcRequest {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as { jsonrpc?: unknown }).jsonrpc === '2.0' &&
    typeof (msg as { method?: unknown }).method === 'string'
  );
}

/**
 * Processa UMA mensagem JSON-RPC. Retorna a resposta, ou `null` quando a
 * mensagem é uma NOTIFICAÇÃO (sem `id`) — notificações não geram resposta.
 */
export async function handleMessage(
  msg: unknown,
  actor: ActorContext,
): Promise<JsonRpcResponse | null> {
  if (!isValidRequest(msg)) {
    return err(null, RPC.INVALID_REQUEST, 'invalid JSON-RPC request');
  }

  const { method } = msg;
  const id = msg.id ?? null;
  const isNotification = msg.id === undefined || msg.id === null;

  // Notificações (notifications/initialized, etc.) não geram resposta.
  if (isNotification && method.startsWith('notifications/')) {
    return null;
  }

  switch (method) {
    case 'initialize': {
      const params = (msg.params ?? {}) as { protocolVersion?: string };
      return ok(id, {
        protocolVersion: params.protocolVersion ?? DEFAULT_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'Servidor MCP da plataforma de dashboards. Use list_catalog + list_connections ' +
          'para descobrir tipos de bloco e conexões; run_query (read-only) para inspecionar ' +
          'dados; create_chart/create_dashboard para montar artefatos e publish_* para publicar.',
      });
    }

    case 'ping':
      return ok(id, {});

    case 'tools/list':
      return ok(id, { tools: listToolDescriptors() });

    case 'tools/call': {
      const params = (msg.params ?? {}) as { name?: unknown; arguments?: unknown };
      if (typeof params.name !== 'string') {
        return err(id, RPC.INVALID_PARAMS, 'tools/call requires a string "name"');
      }
      const tool = getTool(params.name);
      if (!tool) {
        return err(id, RPC.INVALID_PARAMS, `unknown tool: ${params.name}`);
      }
      try {
        const value = await tool.handler(params.arguments ?? {}, { actor });
        return ok(id, toolResult(value));
      } catch (error) {
        const { code, message, detail } = describeToolError(error);
        return ok(
          id,
          toolResult({ error: { code, message, ...(detail ? { detail } : {}) } }, true),
        );
      }
    }

    default:
      return err(id, RPC.METHOD_NOT_FOUND, `method not found: ${method}`);
  }
}

/**
 * Processa um PAYLOAD (mensagem única ou batch). Retorna a resposta única, um
 * array de respostas (batch, descartando notificações), ou `null` quando não há
 * nada a responder (ex.: só notificações).
 */
export async function handlePayload(
  payload: unknown,
  actor: ActorContext,
): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return err(null, RPC.INVALID_REQUEST, 'empty batch');
    }
    const responses: JsonRpcResponse[] = [];
    for (const msg of payload) {
      const res = await handleMessage(msg, actor);
      if (res) responses.push(res);
    }
    return responses.length > 0 ? responses : null;
  }
  return handleMessage(payload, actor);
}
