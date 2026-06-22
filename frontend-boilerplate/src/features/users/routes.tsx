import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { ProtectedRoute } from '../auth/components/protected-route';
import { PageLoader } from '@/shared/components/page-loader';

/**
 * Rotas da feature `users` (boilerplate) — migradas para a convenção de registro
 * por feature (glob). Serve de EXEMPLO canônico para as trilhas FE: lazy load +
 * Suspense + proteção por role.
 */
const UsersPage = lazy(() =>
  import('./index').then((m) => ({ default: m.UsersPage })),
);

export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'users',
      element: (
        <ProtectedRoute requiredRole="ADMIN">
          <Suspense fallback={<PageLoader />}>
            <UsersPage />
          </Suspense>
        </ProtectedRoute>
      ),
    },
  ],
};
