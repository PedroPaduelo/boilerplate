/**
 * Regressão do bloco `signal_card` depois da reescrita sobre o design system.
 *
 * O que este arquivo trava:
 * 1. A COR DA VARIAÇÃO É LEITURA DE NEGÓCIO — subir 4% é bom para arrecadação
 *    e ruim para latência. Quem decide é `trendPolarity`, não o sinal do
 *    número (era exatamente o que o verde/vermelho cravados erravam).
 * 2. BASE DA TENDÊNCIA — `prev-vs-last` (default) compara com o ponto
 *    anterior; `first-vs-last`, com o começo do período.
 * 3. TENDÊNCIA COM RÓTULO — o minigráfico não tem eixo, então precisa se
 *    anunciar por texto.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

const Block = definition.Component;

/** 100 → 110 no período; 105 → 110 no último passo. */
const DATA = [
  { x: '1', y: 100 },
  { x: '2', y: 105 },
  { x: '3', y: 110 },
];

describe('bloco signal_card', () => {
  it('destaca o último valor da série, formatado', () => {
    renderWithProviders(
      <Block props={{ label: 'Latência p95' }} data={DATA} state="success" />,
    );
    expect(screen.getByText('Latência p95')).toBeInTheDocument();
    expect(screen.getByText('110')).toBeInTheDocument();
  });

  it('calcula a variação contra o ponto anterior por padrão', () => {
    renderWithProviders(<Block props={{}} data={DATA} state="success" />);
    expect(screen.getByText('+4,8%')).toBeInTheDocument();
  });

  it('calcula a variação do período quando o bloco pede', () => {
    renderWithProviders(
      <Block props={{ trendBasis: 'first-vs-last' }} data={DATA} state="success" />,
    );
    expect(screen.getByText('+10%')).toBeInTheDocument();
  });

  it('marca a alta como piora quando subir é ruim', () => {
    const { container } = renderWithProviders(
      <Block props={{ trendPolarity: 'up-bad' }} data={DATA} state="success" />,
    );
    const badge = container.querySelector('[data-slot="delta-badge"]');
    expect(badge).toHaveAttribute('data-variant', 'error');
  });

  it('anuncia a tendência desenhada e sabe escondê-la', () => {
    const { unmount } = renderWithProviders(
      <Block props={{ label: 'Sessões' }} data={DATA} state="success" />,
    );
    expect(screen.getByRole('img', { name: 'Sessões: tendência' })).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <Block
        props={{ label: 'Sessões', showSparkline: false }}
        data={DATA}
        state="success"
      />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
