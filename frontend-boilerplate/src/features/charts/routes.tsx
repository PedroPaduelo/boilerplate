import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { RequireRole } from '@/features/auth/components/require-role';

/**
 * Rotas da feature `charts`.
 * - `/charts` — LISTAGEM (T-F2): exige `artifacts:view`.
 * - `/charts/:id` — detalhe/edição do gráfico (playground com dados reais da
 *   query). Exige `artifacts:view`; a edição/publish é gateada por
 *   ownership/permissão na própria tela + no backend.
 */
const ChartsPage = lazy(() =>
  import('./components/charts-page').then((m) => ({ default: m.ChartsPage })),
);
const ChartDetailPage = lazy(() =>
  import('./components/chart-detail-page').then((m) => ({
    default: m.ChartDetailPage,
  })),
);

export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'charts',
      element: (
        <RequireRole permission="artifacts:view">
          <Suspense fallback={<PageLoader />}>
            <ChartsPage />
          </Suspense>
        </RequireRole>
      ),
    },
    {
      path: 'charts/:id',
      element: (
        <RequireRole permission="artifacts:view">
          <Suspense fallback={<PageLoader />}>
            <ChartDetailPage />
          </Suspense>
        </RequireRole>
      ),
    },
  ],
};
