/**
 * Regressão do bloco `leaderboard` depois da reescrita sobre o design system.
 *
 * O que este arquivo trava:
 * 1. RANKING É LISTA ORDENADA — cada linha é um `<li>` dentro de uma `<ol>`,
 *    então a posição é anunciada mesmo sem o número desenhado.
 * 2. PROPORÇÃO AO LÍDER — a barra compara pessoas entre si, não a fatia de
 *    cada uma no total.
 * 3. COR VEM DO TEMA — a barra nunca pinta um literal: a cor é a que o
 *    `useChartPalette` resolve a partir do token do design system.
 * 4. CARREGANDO E SEM DADOS — nenhum dos dois é área em branco.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { useChartPalette } from '@/shared/ui';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/**
 * Sonda: expõe a cor que o TEMA resolve para a barra de série única (o verde
 * escuro a 80% da referência). Comparar a barra com a sonda prova que a cor
 * atravessou a paleta — sem repetir nenhum valor de cor no teste.
 */
function PaletteProbe() {
  const palette = useChartPalette();
  return <span data-testid="palette-probe" data-bar={palette.primary80} />;
}

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
      <>
        <PaletteProbe />
        <Block props={{}} data={fixture} state="success" />
      </>,
    );
    const bars = container.querySelectorAll<HTMLElement>(
      '[data-slot="ranking-bar-fill"]',
    );
    // Ana (1280) é o líder: barra cheia. Bruno (980) fica em ~76,6%.
    expect(bars[0].style.getPropertyValue('inline-size')).toBe('100%');
    expect(bars[1].style.getPropertyValue('inline-size')).toBe('76.5625%');

    // A cor é a MESMA que a paleta resolve do token — nenhum literal no
    // componente. O hover viaja junto, já escurecido (a referência ESCURECE).
    const themeColor = screen.getByTestId('palette-probe').getAttribute('data-bar');
    expect(themeColor).toBeTruthy();
    expect(bars[0].style.getPropertyValue('--chart-bar').trim()).toBe(themeColor);
    expect(bars[0].style.getPropertyValue('--chart-bar-hover').trim()).not.toBe(
      themeColor,
    );
  });

  it('cobre carregando e sem dados', () => {
    const { unmount } = renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    unmount();

    renderWithProviders(<Block props={{}} data={[]} state="success" />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });
});
