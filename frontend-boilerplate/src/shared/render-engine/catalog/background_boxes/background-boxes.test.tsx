/**
 * Regressão do bloco `background_boxes`.
 *
 * Cobre o contrato que a migração precisa preservar: texto acessível por cima,
 * malha decorativa (`aria-hidden`) por trás — e a malha não carrega texto.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

afterEach(() => cleanup());

describe('bloco background_boxes', () => {
  it('expõe título e subtítulo como conteúdo acessível', () => {
    renderWithProviders(
      <definition.Component
        props={{ title: 'Painel da Prefeitura', subtitle: 'Tudo em um lugar.' }}
        state="success"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Painel da Prefeitura' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tudo em um lugar.')).toBeInTheDocument();
  });

  it('mantém a malha fora da árvore de acessibilidade', () => {
    const { container } = renderWithProviders(
      <definition.Component props={{ title: 'Capa' }} state="success" />,
    );

    const mesh = container.querySelector('[data-slot="background-boxes"]');
    expect(mesh).not.toBeNull();
    expect(mesh).toHaveAttribute('aria-hidden', 'true');
    expect(mesh?.textContent).toBe('');
  });
});
