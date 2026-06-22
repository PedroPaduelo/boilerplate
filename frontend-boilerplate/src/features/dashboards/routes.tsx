import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { PlaceholderPage } from '@/shared/components/placeholder-page';
import { RequireRole } from '@/features/auth/components/require-role';

/**
 * Rotas da feature `dashboards`.
 * - `/dashboards` — LISTAGEM (T-F2): exige `artifacts:view`.
 * - `/dashboards/:id` — VIEW (T-G1): render por config + FilterBar + grid,
 *   hidratado via batch + socket. Exige `artifacts:view`.
 * - `/dashboards/:id/edit` — editor (T-G2), ainda placeholder.
 */
const DashboardsPage = lazy(() =>
  import('./components/dashboards-page').then((m) => ({
    default: m.DashboardsPage,
  })),
);

const DashboardView = lazy(() =>
  import('./components/dashboard-view').then((m) => ({
    default: m.DashboardView,
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
        <RequireRole permission="artifacts:view">
          <Suspense fallback={<PageLoader />}>
            <DashboardView />
          </Suspense>
        </RequireRole>
      ),
    },
    {
      path: 'dashboards/:id/edit',
      element: (
        <PlaceholderPage title="Editar dashboard" description="Editor enxuto (T-G2)." />
      ),
    },
  ],
};
