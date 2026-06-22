import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { RequireRole } from '@/features/auth/components/require-role';

/**
 * Rotas da feature `connections` (T-F1).
 *
 * `/connections` exige a permissão `connections:use` (ADMIN/ANALYST/CREATOR) —
 * VIEWER/USER recebem a tela 403. As ações de gestão (criar/editar/excluir)
 * são gateadas adicionalmente DENTRO da página por `connections:manage`.
 */
const ConnectionsPage = lazy(() =>
  import('./components/connections-page').then((m) => ({
    default: m.ConnectionsPage,
  })),
);

export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'connections',
      element: (
        <RequireRole permission="connections:use">
          <Suspense fallback={<PageLoader />}>
            <ConnectionsPage />
          </Suspense>
        </RequireRole>
      ),
    },
  ],
};
