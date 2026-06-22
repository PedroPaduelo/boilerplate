import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProviders } from './providers';

/**
 * Smoke test do ponto de composição de providers (F0.5): a árvore
 * ErrorBoundary → Theme → QueryClient → Auth → Socket monta sem crashar.
 * Sem token no store, o SocketProvider não abre conexão e o AuthProvider não
 * dispara /auth/me — o teste roda offline.
 */
describe('AppProviders (F0.5 smoke)', () => {
  it('monta a árvore de providers sem crashar e renderiza children', () => {
    render(
      <AppProviders>
        <div>conteudo-ok</div>
      </AppProviders>,
    );
    expect(screen.getByText('conteudo-ok')).toBeInTheDocument();
  });
});
