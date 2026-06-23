import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { RequireRole } from '@/features/auth/components/require-role';

/**
 * Rotas da feature `catalog`.
 * - `/catalog` — galeria dos componentes (blocos) do render-engine, cada um
 *   renderizado com dados mockados. Exige `artifacts:view`.
 *
 * Auto-descoberta por `collectFeatureRoutes()` (glob) — NÃO editar o router
 * central (`app/routes.tsx`).
 */
const CatalogPage = lazy(() =>
  import('./components/catalog-page').then((m) => ({ default: m.CatalogPage })),
);

export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'catalog',
      element: (
        <RequireRole permission="artifacts:view">
          <Suspense fallback={<PageLoader />}>
            <CatalogPage />
          </Suspense>
        </RequireRole>
      ),
    },
  ],
};
