import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { RequireRole } from '@/features/auth/components/require-role';

/**
 * Rotas da feature `chat` (T-H) — chat embutido com o agente (MOCKADO).
 *
 * `/chat` exige `artifacts:manage` (espelha o item da sidebar): só quem pode
 * criar/editar artefatos usa o chat e o "adicionar a um dashboard". A T-H2 troca
 * o transporte mock pela API externa real — esta rota não muda.
 */
const ChatPage = lazy(() =>
  import('./components/chat-page').then((m) => ({ default: m.ChatPage })),
);

export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'chat',
      element: (
        <RequireRole permission="artifacts:manage">
          <Suspense fallback={<PageLoader />}>
            <ChatPage />
          </Suspense>
        </RequireRole>
      ),
    },
  ],
};
