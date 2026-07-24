import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { RequireRole } from '@/features/auth/components/require-role';

/**
 * Rotas da feature `home`.
 * - `/home` — VISÃO GERAL: tela inicial do app (KPIs, primeiros passos e
 *   artefatos recentes). Exige `artifacts:view`, a mesma permissão base das
 *   listagens que ela resume.
 */
const HomePage = lazy(() =>
  import('./components/home-page').then((m) => ({ default: m.HomePage })),
);

export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'home',
      element: (
        <RequireRole permission="artifacts:view">
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        </RequireRole>
      ),
    },
  ],
};
