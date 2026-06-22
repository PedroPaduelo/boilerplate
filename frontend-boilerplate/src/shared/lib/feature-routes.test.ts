import { describe, it, expect } from 'vitest';
import { collectFeatureRoutes } from './feature-routes';

/**
 * Verifica o auto-registro de rotas POR FEATURE (F0.5): cada
 * `features/<x>/routes.tsx` é descoberto via `import.meta.glob`, sem índice
 * central. Garante que adicionar uma feature nova entra no router sozinha.
 */
describe('collectFeatureRoutes (F0.5)', () => {
  it('descobre as rotas protegidas declaradas pelas features', () => {
    const { protectedRoutes } = collectFeatureRoutes();
    const paths = protectedRoutes.map((r) => r.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        'users',
        'dashboards',
        'dashboards/:id',
        'dashboards/:id/edit',
        'charts',
        'charts/:id',
        'connections',
        'chat',
      ]),
    );
  });

  it('descobre a rota pública /public/:token (share)', () => {
    const { publicRoutes } = collectFeatureRoutes();
    const paths = publicRoutes.map((r) => r.path);
    expect(paths).toContain('/public/:token');
  });
});
