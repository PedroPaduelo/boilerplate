/**
 * Regressão do bloco `invoice_table` após a migração para o `Table` do Astryx
 * e a repaginação visual (SUB-12): o cálculo da linha (qty × unit) e o total do
 * rodapé continuam iguais.
 *
 * Consulta por PAPEL (cell/columnheader/status/alert), nunca por classe: os
 * nomes de classe são hashes do StyleX e mudam a cada build.
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

  /* ---------------------------------------------------------------------- *
   * Contrato comum (briefing §5) + vocabulário visual
   * ---------------------------------------------------------------------- */

  it('desenha os três rótulos de coluna', () => {
    renderWithProviders(<Component props={{}} data={fixture} state="success" />);

    expect(screen.getByRole('columnheader', { name: 'Item' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Qtd.' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Valor' })).toBeInTheDocument();
  });

  it('a descrição do item aceita Markdown; o valor sai intacto', () => {
    renderWithProviders(
      <Component
        props={{}}
        data={{
          columns: fixture.columns,
          rows: [
            { label: 'Licença **anual**', qty: 2, unit: 1000 },
            { label: 'Suporte', qty: 1, unit: 500 },
          ],
        }}
        state="success"
      />,
    );

    expect(screen.getByRole('cell', { name: 'Licença anual' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'R$ 2.000' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'R$ 2.500' })).toBeInTheDocument();
  });

  it('a regra acima do TOTAL sai do token da grade (nunca de um hex)', () => {
    renderWithProviders(<Component props={{}} data={fixture} state="success" />);

    const style = screen.getByRole('cell', { name: 'Total' }).getAttribute('style') ?? '';

    expect(style).toContain('var(--ds-color-divider)');
    expect(style).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('carregando: esqueleto no lugar da fatura', () => {
    renderWithProviders(<Component props={{}} state="loading" />);

    expect(screen.getByRole('status', { name: /Carregando/ })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('erro: aviso no lugar da fatura (e não "sem itens")', () => {
    renderWithProviders(<Component props={{}} state="error" error="Consulta expirou" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Erro ao carregar o bloco');
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
