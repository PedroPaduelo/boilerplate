import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { RequireRole } from '@/features/auth/components/require-role';
import { ProtectedRoute } from '@/features/auth/components/protected-route';

/**
 * Rotas da feature `dashboards`.
 * - `/dashboards` — LISTAGEM (T-F2): exige `artifacts:view`.
 * - `/dashboards/:id` — VIEW (T-G1): render por config + FilterBar + grid,
 *   hidratado via batch + socket. Exige `artifacts:view`.
 * - `/dashboards/:id/view` — VISUALIZAÇÃO (doc 40): modo de CONSUMO, somente
 *   leitura, com as abas navegáveis numa barra lateral. Rota ADITIVA — a de
 *   cima segue existindo e com o mesmo comportamento. Exige `artifacts:view`.
 * - `/dashboards/:id/edit` — EDITOR enxuto (T-G2): exige `artifacts:manage`
 *   (e ownership, checada dentro do editor via `canModifyArtifact`).
 */
const DashboardsPage = lazy(() =>
  import('./components/dashboards-page').then((m) => ({
    default: m.DashboardsPage,
  })),
);

const DashboardView = lazy(() =>
  import('./components/dashboard-view').then((m) => ({
    default: m.DashboardView,
  })),
);

const DashboardViewer = lazy(() =>
  import('./components/dashboard-viewer').then((m) => ({
    default: m.DashboardViewer,
  })),
);

const DashboardEditor = lazy(() =>
  import('./components/dashboard-editor').then((m) => ({
    default: m.DashboardEditor,
  })),
);

export const featureRoutes: FeatureRoutes = {
  /**
   * `/dashboards/:id/view` fica no slot RAIZ, e não em `protected`, porque o
   * modo de visualização é uma tela AUTÔNOMA: sem a barra lateral do app, sem a
   * topbar, sem o menu de usuário. É a tela que se abre num telão, se projeta
   * numa reunião ou se deixa aberta numa segunda guia o dia inteiro — e nesse
   * uso o cromo do app é justamente o que atrapalha.
   *
   * "Raiz" aqui NÃO quer dizer pública: o `ProtectedRoute` (sessão) e o
   * `RequireRole` (permissão) continuam envolvendo a tela, exatamente como nas
   * rotas de dentro do shell. A única coisa que sai é o `DashboardLayout`.
   *
   * Precisa vir ANTES de `dashboards/:id` na lista final de rotas — e vem, pelo
   * simples fato de as rotas do slot raiz serem registradas antes do `/` no
   * `app/routes.tsx`.
   */
  public: [
    {
      path: '/dashboards/:id/view',
      element: (
        <ProtectedRoute>
          <RequireRole permission="artifacts:view">
            <Suspense fallback={<PageLoader />}>
              <DashboardViewer />
            </Suspense>
          </RequireRole>
        </ProtectedRoute>
      ),
    },
  ],
  protected: [
    {
      path: 'dashboards',
      element: (
        <RequireRole permission="artifacts:view">
          <Suspense fallback={<PageLoader />}>
            <DashboardsPage />
          </Suspense>
        </RequireRole>
      ),
    },
    {
      path: 'dashboards/:id',
      element: (
        <RequireRole permission="artifacts:view">
          <Suspense fallback={<PageLoader />}>
            <DashboardView />
          </Suspense>
        </RequireRole>
      ),
    },

    {
      path: 'dashboards/:id/edit',
      element: (
        <RequireRole permission="artifacts:manage">
          <Suspense fallback={<PageLoader />}>
            <DashboardEditor />
          </Suspense>
        </RequireRole>
      ),
    },
  ],
};
