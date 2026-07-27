/**
 * Itens da paleta de comandos.
 *
 * Tudo o que aparece na paleta vem das listagens já carregadas pelo TanStack
 * Query (dados de "referência", com staleTime longo), então abrir a paleta não
 * dispara rede na maioria das vezes.
 *
 * Este arquivo só REÚNE dados e permissões; a montagem de cada seção é pura e
 * mora em `lib/command-items.ts`.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useColorMode } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/store';
import { useCharts } from '@/features/charts/hooks';
import { useConnections } from '@/features/connections/hooks';
import { useCreateDashboard, useDashboards } from '@/features/dashboards/hooks';
import { hasAnyRole, hasPermission } from '@/shared/lib/rbac';
import {
  buildActionItems,
  buildArtifactItems,
  buildConnectionItems,
  buildNavigationItems,
  type CommandHandlers,
  type CommandPermissions,
} from './lib/command-items';

export {
  COMMAND_GROUPS,
  type CommandAction,
  type CommandActionData,
} from './lib/command-items';

import type { CommandAction } from './lib/command-items';

/** Quantos artefatos de cada tipo a paleta carrega para oferecer como atalho. */
const LOOKUP_PAGE_SIZE = 50;

export function useCommandActions(): CommandAction[] {
  const navigate = useNavigate();
  const { resolvedMode, setMode } = useColorMode();

  const role = useAuthStore((s) => s.user?.role);
  const permissions: CommandPermissions = {
    canManage: hasPermission(role, 'artifacts:manage'),
    canUseConnections: hasPermission(role, 'connections:use'),
    isAdmin: hasAnyRole(role, ['ADMIN']),
  };

  const { data: dashboardsData } = useDashboards({ page: 1, pageSize: LOOKUP_PAGE_SIZE });
  const { data: chartsData } = useCharts({ page: 1, pageSize: LOOKUP_PAGE_SIZE });
  const { data: connectionsData } = useConnections(
    { pageSize: LOOKUP_PAGE_SIZE },
    { enabled: permissions.canUseConnections },
  );

  const create = useCreateDashboard();

  const { canManage, canUseConnections, isAdmin } = permissions;

  return useMemo(() => {
    const isDark = resolvedMode === 'dark';
    const scope: CommandPermissions = { canManage, canUseConnections, isAdmin };
    const handlers: CommandHandlers = {
      navigate,
      createDashboard: () =>
        create.mutate(undefined, {
          onSuccess: (dashboard) => navigate(`/dashboards/${dashboard.id}/edit`),
        }),
      toggleColorMode: () => setMode(isDark ? 'light' : 'dark'),
    };

    return [
      ...buildActionItems(scope, handlers, isDark),
      ...buildNavigationItems(scope, handlers),
      ...buildArtifactItems(dashboardsData?.dashboards ?? [], 'dashboard', handlers),
      ...buildArtifactItems(chartsData?.charts ?? [], 'chart', handlers),
      ...buildConnectionItems(connectionsData?.connections ?? [], handlers),
    ];
  }, [
    canManage,
    canUseConnections,
    isAdmin,
    chartsData,
    connectionsData,
    create,
    dashboardsData,
    navigate,
    resolvedMode,
    setMode,
  ]);
}
