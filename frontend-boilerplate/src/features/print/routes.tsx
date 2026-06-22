import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';

/**
 * Rotas da feature `print` (T-J).
 *
 * `/print/dashboards/:id` é uma rota PÚBLICA (nível raiz, fora do
 * `DashboardLayout`): layout limpo sem sidebar/topbar/ações. É aberta pelo
 * serviço headless (Playwright, no backend) para gerar o PDF. A autenticação
 * acontece via TOKEN DE SERVIÇO na query string (`?token=`), não via sessão.
 */
const PrintDashboardView = lazy(() =>
  import('./components/print-dashboard-view').then((m) => ({
    default: m.PrintDashboardView,
  })),
);

export const featureRoutes: FeatureRoutes = {
  public: [
    {
      path: '/print/dashboards/:id',
      element: (
        <Suspense fallback={<PageLoader />}>
          <PrintDashboardView />
        </Suspense>
      ),
    },
  ],
};
