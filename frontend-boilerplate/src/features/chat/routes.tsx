import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PlaceholderPage } from '@/shared/components/placeholder-page';

/**
 * Rota-esqueleto da feature `chat` (TRILHA T-H). Chat embutido (mockado primeiro,
 * integração com a API externa depois). Path previsto (doc 32): /chat.
 */
export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'chat',
      element: (
        <PlaceholderPage title="Chat" description="Chat embutido com o agente (T-H)." />
      ),
    },
  ],
};
