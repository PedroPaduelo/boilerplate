/**
 * Resolução do ATOR de serviço do MCP (T-D).
 *
 * As tools do MCP atuam EM NOME de um usuário real do nosso sistema (o
 * "service account" do agente externo). Esse ator é a âncora de RBAC/ownership:
 *   - `ownerId` dos charts/dashboards criados = `actor.userId`;
 *   - todas as checagens de visibilidade/permissão usam `actor.role` e
 *     `actor.departmentIds` — exatamente como nas rotas REST (sem burlar).
 *
 * O ator é resolvido a partir do banco (papel + memberships REAIS), de modo que
 * o MCP NUNCA tem mais poder do que o papel do usuário de serviço configurado.
 * A identidade vem da config (`MCP_SERVICE_USER_ID` ou `MCP_SERVICE_USER_EMAIL`).
 */
import { prisma } from '@/lib/prisma';
import type { ActorContext } from '@/lib/rbac';
import { getMcpConfig } from './config';

/** Erro de configuração do MCP (ex.: usuário de serviço ausente/inexistente). */
export class McpConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'McpConfigError';
  }
}

/**
 * Resolve o `ActorContext` do usuário de serviço configurado. Faz UMA leitura do
 * usuário (id/role) + UMA das memberships. Lança `McpConfigError` se nenhum
 * identificador estiver configurado ou se o usuário não existir — o endpoint
 * traduz isso em 503 (config incompleta), não 500.
 */
export async function resolveMcpActor(): Promise<ActorContext> {
  const { serviceUserId, serviceUserEmail } = getMcpConfig();

  if (!serviceUserId && !serviceUserEmail) {
    throw new McpConfigError(
      'MCP service actor is not configured (set MCP_SERVICE_USER_ID or MCP_SERVICE_USER_EMAIL)',
    );
  }

  const user = serviceUserId
    ? await prisma.user.findUnique({ where: { id: serviceUserId }, select: { id: true, role: true } })
    : await prisma.user.findUnique({
        where: { email: serviceUserEmail as string },
        select: { id: true, role: true },
      });

  if (!user) {
    throw new McpConfigError('MCP service user not found for the configured identity');
  }

  const memberships = await prisma.departmentMembership.findMany({
    where: { userId: user.id },
    select: { departmentId: true },
  });

  return {
    userId: user.id,
    role: user.role,
    departmentIds: memberships.map((m) => m.departmentId),
  };
}
