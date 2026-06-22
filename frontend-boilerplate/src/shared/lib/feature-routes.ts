import type { RouteObject } from 'react-router-dom';

/**
 * Contrato de registro de rotas POR FEATURE (ponto de extensão da Fase 0).
 *
 * Cada feature cria `src/features/<feature>/routes.tsx` exportando
 * `export const featureRoutes: FeatureRoutes = { ... }`. O agregador
 * `collectFeatureRoutes()` descobre TODOS via `import.meta.glob` — nenhuma
 * trilha edita um `routes.tsx` central. Isso é o análogo FE do auto-registro do
 * render-engine (catalog) e do autoload do backend.
 */
export interface FeatureRoutes {
  /**
   * Rotas PÚBLICAS (nível raiz, SEM auth): ex. `/login` já é tratado no app;
   * use para `/public/:token` (share) etc.
   */
  public?: RouteObject[];
  /**
   * Rotas PROTEGIDAS: viram filhas de `/` (dentro do `DashboardLayout`, atrás
   * do `ProtectedRoute`). Declare `path` relativo (ex.: `dashboards`,
   * `dashboards/:id`).
   */
  protected?: RouteObject[];
}

interface FeatureRouteModule {
  featureRoutes?: FeatureRoutes;
}

export interface CollectedRoutes {
  publicRoutes: RouteObject[];
  protectedRoutes: RouteObject[];
}

/**
 * Varre `src/features/(asterisco)/routes.tsx` (eager) e agrega as rotas declaradas por
 * cada feature. Ordena por caminho do módulo para um resultado determinístico.
 */
export function collectFeatureRoutes(): CollectedRoutes {
  const modules = import.meta.glob<FeatureRouteModule>(
    '../../features/*/routes.tsx',
    { eager: true },
  );

  const publicRoutes: RouteObject[] = [];
  const protectedRoutes: RouteObject[] = [];

  for (const path of Object.keys(modules).sort()) {
    const mod = modules[path];
    const fr = mod?.featureRoutes;
    if (!fr) continue;
    if (fr.public) publicRoutes.push(...fr.public);
    if (fr.protected) protectedRoutes.push(...fr.protected);
  }

  return { publicRoutes, protectedRoutes };
}
