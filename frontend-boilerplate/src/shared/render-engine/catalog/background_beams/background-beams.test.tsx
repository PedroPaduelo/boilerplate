/**
 * Regressão do bloco `background_beams`.
 *
 * O que precisa continuar verdadeiro depois da migração: o texto é conteúdo de
 * verdade (heading + parágrafo do DS, legível por leitor de tela) e a camada
 * de feixes é decoração pura (`aria-hidden`), nunca o portador da informação.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

afterEach(() => cleanup());

describe('bloco background_beams', () => {
  it('expõe título e subtítulo como conteúdo acessível', () => {
    renderWithProviders(
      <definition.Component
        props={{ title: 'Inteligência de dados', subtitle: 'Números viram decisões.' }}
        state="success"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Inteligência de dados' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Números viram decisões.')).toBeInTheDocument();
  });

  it('mantém a camada de feixes fora da árvore de acessibilidade', () => {
    const { container } = renderWithProviders(
      <definition.Component props={{ title: 'Capa' }} state="success" />,
    );

    const beams = container.querySelector('[data-slot="background-beams"]');
    expect(beams).not.toBeNull();
    expect(beams).toHaveAttribute('aria-hidden', 'true');
    expect(beams?.textContent).toBe('');
  });
});
