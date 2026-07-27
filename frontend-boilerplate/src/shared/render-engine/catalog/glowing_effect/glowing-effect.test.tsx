/**
 * Regressão do bloco `glowing_effect`.
 *
 * O anel é enfeite: o conteúdo do card precisa continuar legível sem ele, e o
 * anel não pode entrar na árvore de acessibilidade nem capturar ponteiro.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

afterEach(() => cleanup());

describe('bloco glowing_effect', () => {
  it('mostra título e descrição do card', () => {
    renderWithProviders(
      <definition.Component
        props={{ title: 'Painel em destaque', description: 'Passe o mouse.' }}
        state="success"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Painel em destaque' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Passe o mouse.')).toBeInTheDocument();
  });

  it('mantém o anel decorativo e sem eventos', () => {
    const { container } = renderWithProviders(
      <definition.Component
        props={{ title: 'Destaque', variant: 'white' }}
        state="success"
      />,
    );

    const ring = container.querySelector('[data-slot="glowing-effect-ring"]');
    expect(ring).not.toBeNull();
    expect(ring).toHaveAttribute('aria-hidden', 'true');
    // O anel não captura ponteiro por UTILITY (regra 2.3: `style` inline só
    // para runtime/SVG). A classe é escrita à mão — não é nome gerado pelo
    // StyleX —, então checá-la aqui é estável.
    expect(ring).toHaveClass('pointer-events-none');

    const root = container.querySelector('[data-slot="glowing-effect"]');
    expect(root).toHaveAttribute('data-variant', 'white');
  });
});
