import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { PlaceholderPage } from '@/shared/components/placeholder-page';
import { RequireRole } from '@/features/auth/components/require-role';

/**
 * Rotas da feature `dashboards`.
 * - `/dashboards` — LISTAGEM (T-F2): exige `artifacts:view`.
 * - `/dashboards/:id` e `/dashboards/:id/edit` — render/editor (T-G), ainda
 *   placeholders.
 */
const DashboardsPage = lazy(() =>
  import('./components/dashboards-page').then((m) => ({
    default: m.DashboardsPage,
  })),
);

export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'dashboards',
      element: (
        <RequireRole permission="artifacts:view">
          <Suspense fallback={<PageLoader />}>
            <DashboardsPage />
          </Suspense>
        </RequireRole>
      ),
    },
    {
      path: 'dashboards/:id',
      element: (
        <PlaceholderPage
          title="Dashboard"
          description="Render por config + filtros + grid (T-G)."
        />
      ),
    },
    {
      path: 'dashboards/:id/edit',
      element: (
        <PlaceholderPage title="Editar dashboard" description="Editor enxuto (T-G)." />
      ),
    },
  ],
};
