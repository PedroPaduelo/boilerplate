import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { RequireRole } from '@/features/auth/components/require-role';

/**
 * Rotas da feature `dashboards`.
 * - `/dashboards` — LISTAGEM (T-F2): exige `artifacts:view`.
 * - `/dashboards/:id` — VIEW (T-G1): render por config + FilterBar + grid,
 *   hidratado via batch + socket. Exige `artifacts:view`.
 * - `/dashboards/:id/edit` — EDITOR enxuto (T-G2): exige `artifacts:manage`
 *   (e ownership, checada dentro do editor via `canModifyArtifact`).
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

const DashboardEditor = lazy(() =>
  import('./components/dashboard-editor').then((m) => ({
    default: m.DashboardEditor,
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
        <RequireRole permission="artifacts:manage">
          <Suspense fallback={<PageLoader />}>
            <DashboardEditor />
          </Suspense>
        </RequireRole>
      ),
    },
  ],
};
