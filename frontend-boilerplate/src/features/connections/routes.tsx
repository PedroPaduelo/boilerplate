import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PlaceholderPage } from '@/shared/components/placeholder-page';

/**
 * Rotas-esqueleto da feature `connections` (TRILHA T-A/T-E/T-F).
 * Substitua os placeholders pelas telas reais (lista + cadastro/teste/schema).
 */
export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'connections',
      element: (
        <PlaceholderPage
          title="Conexões"
          description="Cadastro, teste e introspecção de conexões (T-A/T-F)."
        />
      ),
    },
  ],
};
