import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { PlaceholderPage } from '@/shared/components/placeholder-page';
import { RequireRole } from '@/features/auth/components/require-role';

/**
 * Rotas da feature `charts`.
 * - `/charts` — LISTAGEM (T-F2): exige `artifacts:view`.
 * - `/charts/:id` — view/preview do gráfico (T-G), ainda placeholder.
 */
const ChartsPage = lazy(() =>
  import('./components/charts-page').then((m) => ({ default: m.ChartsPage })),
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
        <PlaceholderPage
          title="Gráfico"
          description="View/preview do gráfico (T-G)."
        />
      ),
    },
  ],
};
