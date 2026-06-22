import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PlaceholderPage } from '@/shared/components/placeholder-page';

/**
 * Rotas-esqueleto da feature `dashboards` (TRILHAS T-F lista / T-G render+editor).
 * Paths previstos (doc 32): /dashboards, /dashboards/:id, /dashboards/:id/edit.
 */
export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'dashboards',
      element: (
        <PlaceholderPage
          title="Dashboards"
          description="Listagem de dashboards (T-F)."
        />
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
