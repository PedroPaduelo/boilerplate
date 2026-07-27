/**
 * Regressão do bloco `invoice_table` após a migração para o `Table` do Astryx:
 * o cálculo da linha (qty × unit) e o total do rodapé continuam iguais.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';
import { fixture } from './fixture';

afterEach(() => cleanup());

describe('bloco invoice_table', () => {
  it('mostra cada item com o valor da linha (qty × unit)', () => {
    renderWithProviders(<Component props={{}} data={fixture} state="success" />);

    expect(screen.getByRole('cell', { name: 'Licença de software' })).toBeInTheDocument();
    // 3 × 1200 = 3.600
    expect(screen.getByRole('cell', { name: 'R$ 3.600' })).toBeInTheDocument();
  });

  it('fecha com o total no rodapé', () => {
    renderWithProviders(<Component props={{}} data={fixture} state="success" />);

    // 3×1200 + 12×450 + 2×800 = 10.600
    expect(screen.getByRole('cell', { name: 'R$ 10.600' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Total' })).toBeInTheDocument();
  });

  it('respeita a moeda escolhida', () => {
    renderWithProviders(
      <Component props={{ currency: 'USD' }} data={fixture} state="success" />,
    );

    expect(screen.getByRole('cell', { name: '$ 10.600' })).toBeInTheDocument();
  });

  it('sem itens: estado vazio no lugar da tabela', () => {
    renderWithProviders(
      <Component
        props={{}}
        data={{ columns: fixture.columns, rows: [] }}
        state="success"
      />,
    );

    expect(screen.getByText('Fatura sem itens')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
