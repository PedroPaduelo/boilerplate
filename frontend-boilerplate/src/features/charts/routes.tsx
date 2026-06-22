import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PlaceholderPage } from '@/shared/components/placeholder-page';

/**
 * Rotas-esqueleto da feature `charts` (TRILHA T-F).
 * Paths previstos (doc 32): /charts, /charts/:id.
 */
export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'charts',
      element: (
        <PlaceholderPage title="Gráficos" description="Listagem de gráficos (T-F)." />
      ),
    },
    {
      path: 'charts/:id',
      element: (
        <PlaceholderPage
          title="Gráfico"
          description="View/preview do gráfico (T-F/T-G)."
        />
      ),
    },
  ],
};
