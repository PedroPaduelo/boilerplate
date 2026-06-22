import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { McpConfigError, resolveMcpActor } from './actor';
import { getMcpConfig, isMcpEnabled, timingSafeEqualStr } from './config';
import { handlePayload } from './protocol';

/**
 * Módulo `mcp` — TRILHA T-D (servidor MCP / tools para o agente EXTERNO).
 *
 * Plugin auto-descoberto (`@fastify/autoload`, ver `src/modules/README.md`).
 *
 * TRANSPORTE: HTTP "Streamable" — um único endpoint `POST /mcp` que recebe
 * mensagens JSON-RPC 2.0 (MCP) e responde `application/json`. Stateless (sem
 * sessão): cada request é autenticado e atendido isoladamente. `GET /mcp`
 * responde 405 (não há canal SSE iniciado pelo servidor neste MVP).
 *
 * AUTH: bearer/API-key. O header `Authorization: Bearer <MCP_API_KEY>` é
 * comparado (tempo constante) com a env `MCP_API_KEY`. Sem API-key configurada o
 * endpoint fica DESABILITADO (503, fail-closed). O ATOR de serviço (usuário em
 * nome de quem o agente atua) é resolvido de `MCP_SERVICE_USER_ID`/
 * `MCP_SERVICE_USER_EMAIL` — todas as tools respeitam o RBAC/visibilidade desse
 * papel (ver `actor.ts`).
 *
 * As tools (`./tools`) reusam os SERVICES dos módulos T-A/T-B/T-C — nenhuma
 * regra de negócio é reimplementada aqui.
 */

/** Extrai o token bearer do header Authorization (ou `null`). */
function extractBearer(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

function sendJson(reply: FastifyReply, status: number, body: unknown): FastifyReply {
  return reply.code(status).header('content-type', 'application/json; charset=utf-8').send(body);
}

const mcpModule: FastifyPluginAsync = async (app) => {
  // GET /mcp — sem canal SSE server-initiated neste MVP.
  app.get('/mcp', async (_request, reply) =>
    sendJson(reply.header('allow', 'POST'), 405, {
      error: 'method_not_allowed',
      message: 'Use POST /mcp with JSON-RPC 2.0 messages (MCP Streamable HTTP).',
    }),
  );

  // POST /mcp — endpoint JSON-RPC do MCP.
  app.post('/mcp', async (request, reply) => {
    // fail-closed: sem API-key configurada, o MCP fica desabilitado.
    if (!isMcpEnabled()) {
      return sendJson(reply, 503, {
        error: 'mcp_disabled',
        message: 'MCP server is not configured (MCP_API_KEY is unset).',
      });
    }

    // auth por bearer/API-key (comparação em tempo constante).
    const token = extractBearer(request);
    const { apiKey } = getMcpConfig();
    if (!token || !apiKey || !timingSafeEqualStr(token, apiKey)) {
      return sendJson(reply.header('www-authenticate', 'Bearer'), 401, {
        error: 'unauthorized',
        message: 'Missing or invalid MCP API key.',
      });
    }

    // resolve o ator de serviço (config incompleta → 503, não 500).
    let actor;
    try {
      actor = await resolveMcpActor();
    } catch (error) {
      if (error instanceof McpConfigError) {
        return sendJson(reply, 503, { error: 'mcp_misconfigured', message: error.message });
      }
      throw error;
    }

    const response = await handlePayload(request.body, actor);

    // só notificações → 202 Accepted sem corpo (convenção Streamable HTTP).
    if (response === null) {
      return reply.code(202).send();
    }
    return sendJson(reply, 200, response);
  });
};

export default mcpModule;
