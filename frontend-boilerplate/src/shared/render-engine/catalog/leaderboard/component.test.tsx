/**
 * Regressão do bloco `leaderboard` depois da reescrita sobre o design system.
 *
 * O que este arquivo trava:
 * 1. RANKING É LISTA ORDENADA — cada linha é um `<li>` dentro de uma `<ol>`,
 *    então a posição é anunciada mesmo sem o número desenhado.
 * 2. PROPORÇÃO AO LÍDER — a barra compara pessoas entre si, não a fatia de
 *    cada uma no total.
 * 3. CARREGANDO E SEM DADOS — nenhum dos dois é área em branco.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

describe('bloco leaderboard', () => {
  it('lista as posições na ordem recebida, com nome e valor', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveTextContent('Ana Souza');
    expect(rows[0]).toHaveTextContent('1.280');
    expect(rows[4]).toHaveTextContent('Eva Martins');
  });

  it('cola a unidade ao valor quando o bloco a declara', () => {
    renderWithProviders(<Block props={{ unit: 'pts' }} data={fixture} state="success" />);
    expect(screen.getByText('1.280 pts')).toBeInTheDocument();
  });

  it('desenha a barra proporcional ao líder, com cor de token', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );
    const bars = container.querySelectorAll('[data-slot="chart-bar-track"] > span');
    // Ana (1280) é o líder: barra cheia. Bruno (980) fica em ~76,6%.
    expect(bars[0].getAttribute('style')).toContain('inline-size: 100%');
    expect(bars[1].getAttribute('style')).toContain('inline-size: 76.5625%');
    expect(container.innerHTML).toContain('--color-data-categorical-');
  });

  it('cobre carregando e sem dados', () => {
    const { unmount } = renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    unmount();

    renderWithProviders(<Block props={{}} data={[]} state="success" />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });
});
