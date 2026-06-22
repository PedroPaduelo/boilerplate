/**
 * Configuração do servidor MCP (T-D) — lida de variáveis de ambiente.
 *
 * O agente de IA é EXTERNO (decisão travada no doc 22): ele consome o nosso MCP
 * server. Para isso precisamos de:
 *
 *   - MCP_API_KEY            token de serviço (bearer) que autentica o runtime
 *                            externo. SEM ele configurado, o endpoint /mcp fica
 *                            DESABILITADO (responde 503) — fail-closed.
 *   - MCP_SERVICE_USER_ID    (ou MCP_SERVICE_USER_EMAIL) — o usuário do nosso
 *                            sistema EM NOME DE QUEM o agente atua. É a âncora de
 *                            RBAC/ownership: charts/dashboards criados pelo agente
 *                            pertencem a esse usuário e TODAS as tools respeitam a
 *                            visibilidade/permissão desse papel (sem burlar).
 *
 * Estas envs são LIDAS DIRETO de `process.env` (e não somadas ao schema central
 * `@/lib/env`) de propósito: mantêm o módulo `mcp` autossuficiente e não alteram
 * o contrato de boot compartilhado (não quebram quem não usa MCP). O `dotenv`
 * já foi carregado por `@/lib/env` no boot, então `process.env` está populado.
 */
import { timingSafeEqual } from 'node:crypto';

/** Configuração resolvida do MCP. */
export interface McpConfig {
  apiKey: string | null;
  serviceUserId: string | null;
  serviceUserEmail: string | null;
}

function readTrimmed(name: string): string | null {
  const raw = process.env[name];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Lê a configuração atual do MCP a partir de `process.env` (sem cache — testável). */
export function getMcpConfig(): McpConfig {
  return {
    apiKey: readTrimmed('MCP_API_KEY'),
    serviceUserId: readTrimmed('MCP_SERVICE_USER_ID'),
    serviceUserEmail: readTrimmed('MCP_SERVICE_USER_EMAIL'),
  };
}

/** O MCP está habilitado (API-key configurada)? */
export function isMcpEnabled(): boolean {
  return getMcpConfig().apiKey !== null;
}

/**
 * Comparação de tokens em tempo CONSTANTE (evita timing-attack na API-key).
 * Sem dependências externas — usa só `crypto` do Node.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
