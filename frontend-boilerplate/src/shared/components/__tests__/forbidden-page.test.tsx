import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ForbiddenPage } from '../forbidden-page';

describe('ForbiddenPage (403)', () => {
  it('explica o bloqueio e oferece uma saída de verdade', () => {
    renderWithProviders(<ForbiddenPage />, { route: '/users' });

    expect(screen.getByRole('heading', { name: 'Acesso negado' })).toBeInTheDocument();
    expect(
      screen.getByText('Você não tem permissão para acessar esta página.'),
    ).toBeInTheDocument();

    // A saída é um LINK (navegação client-side via LinkProvider), não um
    // botão que "simula" navegação: abre em nova aba, copia endereço, etc.
    const back = screen.getByRole('link', { name: 'Voltar ao início' });
    expect(back).toHaveAttribute('href', '/');
  });

  it('usa a descrição específica quando o guarda informa o motivo', () => {
    renderWithProviders(
      <ForbiddenPage description="Requer o papel ADMIN para gerenciar usuários." />,
    );

    expect(
      screen.getByText('Requer o papel ADMIN para gerenciar usuários.'),
    ).toBeInTheDocument();
  });
});
