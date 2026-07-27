import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { PageLoader } from '../page-loader';

describe('PageLoader (fallback das rotas lazy)', () => {
  it('anuncia o carregamento em vez de deixar a tela muda', () => {
    renderWithProviders(<PageLoader />);

    expect(
      screen.getByRole('status', { name: 'Carregando a página' }),
    ).toBeInTheDocument();
  });
});
