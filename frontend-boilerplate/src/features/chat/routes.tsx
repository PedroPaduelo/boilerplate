import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { RequireRole } from '@/features/auth/components/require-role';

/**
 * Rotas da feature `chat` — chat com o agente de IA integrado.
 *
 * /chat exige `artifacts:manage`.
 * O agente usa as tools do MCP (list_connections, run_query, create_chart, etc.)
 * e tem acesso aos dados do sistema com RBAC do usuário autenticado.
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
