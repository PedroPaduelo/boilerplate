import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';

/**
 * Rotas da feature `share`. A rota PÚBLICA `/public/:token` (T-G1) renderiza o
 * dashboard/chart published read-only SEM auth (nível raiz, fora do
 * DashboardLayout). Trata revogado/expirado/inexistente com telas claras.
 */
const PublicDashboardView = lazy(() =>
  import('./components/public-dashboard-view').then((m) => ({
    default: m.PublicDashboardView,
  })),
);

export const featureRoutes: FeatureRoutes = {
  public: [
    {
      path: '/public/:token',
      element: (
        <Suspense fallback={<PageLoader />}>
          <PublicDashboardView />
        </Suspense>
      ),
    },
  ],
};
