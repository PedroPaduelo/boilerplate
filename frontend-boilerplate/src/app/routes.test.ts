import { describe, it, expect } from 'vitest';
import { router } from './routes';

/**
 * Garante que o router central (casca da Fase 0 + rotas agregadas por feature)
 * é construído sem erro e contém a estrutura esperada.
 */
describe('router (F0.5)', () => {
  it('constrói o router com auth, shell protegido e fallback', () => {
    const topPaths = router.routes.map((r) => r.path);
    expect(topPaths).toEqual(
      expect.arrayContaining(['/login', '/register', '/public/:token', '/', '*']),
    );

    const shell = router.routes.find((r) => r.path === '/');
    expect(shell?.children?.length).toBeGreaterThan(0);
  });
});
