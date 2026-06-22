/**
 * Gate de PERMISSÃO das tools do MCP (T-D).
 *
 * CRÍTICO p/ segurança: nas rotas REST a permissão de papel é imposta no
 * `preHandler` (`requirePermission(...)`) — os SERVICES (createChart, etc.) NÃO
 * checam papel, só ownership/visibilidade. Como as tools chamam os services
 * DIRETO (sem passar pelo preHandler), elas precisam aplicar a MESMA matriz RBAC
 * aqui, senão o ator de serviço poderia criar/publicar sem ter a permissão.
 *
 * Espelha exatamente os `requirePermission(...)` das rotas:
 *   - criar/editar charts e dashboards (incl. add_chart) → `artifacts:manage`;
 *   - publicar charts e dashboards                       → `artifacts:publish`.
 * (As tools de conexão já gateiam via `canUseConnections`/`requireConnectionForUse`.)
 */
import { ForbiddenError } from '@/http/routes/_errors';
import { hasPermission, type Permission } from '@/lib/rbac';
import type { ActorContext } from '@/lib/rbac';

/** Lança `ForbiddenError` se o ator não tem a permissão (mesma checagem do REST). */
export function assertPermission(actor: ActorContext, permission: Permission): void {
  if (!hasPermission(actor.role, permission)) {
    throw new ForbiddenError(`Missing required permission: ${permission}`);
  }
}
