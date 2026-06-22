import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PlaceholderPage } from '@/shared/components/placeholder-page';

/**
 * Rota-esqueleto da feature `share` (TRILHA T-B/T-E). A rota PÚBLICA
 * `/public/:token` renderiza o dashboard read-only SEM auth (fica no nível
 * raiz, fora do DashboardLayout). Trata expirado/revogado.
 */
export const featureRoutes: FeatureRoutes = {
  public: [
    {
      path: '/public/:token',
      element: (
        <PlaceholderPage
          title="Compartilhamento público"
          description="Dashboard read-only via token (T-B/T-E)."
        />
      ),
    },
  ],
};
