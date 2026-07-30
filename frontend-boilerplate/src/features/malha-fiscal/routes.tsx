import { lazy, Suspense } from 'react';
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PageLoader } from '@/shared/components/page-loader';
import { RequireRole } from '@/features/auth/components/require-role';

/**
 * Rotas da feature `malha-fiscal`.
 * - `/malha-fiscal` — painel analítico do cruzamento NFS-e × PGDAS e geração
 *   dos lotes de fiscalização. Ver exige `artifacts:view`, a mesma permissão
 *   base das demais telas de análise; GERAR lote exige `artifacts:manage` e é
 *   verificado dentro da página (o botão nasce desabilitado, com o motivo).
 */
const MalhaFiscalPage = lazy(() =>
  import('./components/malha-fiscal-page').then((m) => ({ default: m.MalhaFiscalPage })),
);

export const featureRoutes: FeatureRoutes = {
  protected: [
    {
      path: 'malha-fiscal',
      element: (
        <RequireRole permission="artifacts:view">
          <Suspense fallback={<PageLoader />}>
            <MalhaFiscalPage />
          </Suspense>
        </RequireRole>
      ),
    },
  ],
};
