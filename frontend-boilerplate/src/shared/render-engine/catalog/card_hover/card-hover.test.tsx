/**
 * Regressão do bloco `card_hover`.
 *
 * O efeito é o halo, mas o que não pode regredir é o essencial: cada item
 * continua sendo UM link navegável, com nome acessível igual ao título. O halo
 * é decoração e só aparece quando há card ativo.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, cleanup, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

const ITEMS = [
  { title: 'Arrecadação', description: 'Receita por tributo.', link: '/arrecadacao' },
  { title: 'Dívida ativa', description: 'Estoque e recuperação.', link: '/divida' },
];

afterEach(() => cleanup());

describe('bloco card_hover', () => {
  it('renderiza um link por item, com nome acessível e destino', () => {
    renderWithProviders(
      <definition.Component props={{ items: ITEMS }} state="success" />,
    );

    expect(screen.getByRole('link', { name: 'Arrecadação' })).toHaveAttribute(
      'href',
      '/arrecadacao',
    );
    expect(screen.getByRole('link', { name: 'Dívida ativa' })).toBeInTheDocument();
    expect(screen.getByText('Receita por tributo.')).toBeInTheDocument();
  });

  it('acende o halo decorativo só com card ativo', () => {
    const { container } = renderWithProviders(
      <definition.Component props={{ items: ITEMS }} state="success" />,
    );

    expect(container.querySelector('[data-slot="card-hover-halo"]')).toBeNull();

    const slot = container.querySelector('[data-slot="card-hover-slot"]');
    expect(slot).not.toBeNull();
    fireEvent.pointerEnter(slot as Element);

    const halo = container.querySelector('[data-slot="card-hover-halo"]');
    expect(halo).not.toBeNull();
    expect(halo).toHaveAttribute('aria-hidden', 'true');
  });
});
