/**
 * Regressão do bloco `mobius_loop`.
 *
 * A fita é ilustração: fica fora da árvore de acessibilidade (não promete
 * "carregando" a quem não vê) e respeita o `size` declarado nas props.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

afterEach(() => cleanup());

describe('bloco mobius_loop', () => {
  it('desenha a fita como decoração, no tamanho pedido', () => {
    const { container } = renderWithProviders(
      <definition.Component props={{ size: 96, speed: 'fast' }} state="success" />,
    );

    const icon = container.querySelector('[data-slot="mobius-loop-icon"]');
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('width', '96');
    expect(icon).toHaveAttribute('height', '96');
  });

  it('cai no tamanho padrão quando a prop não vem', () => {
    const { container } = renderWithProviders(
      <definition.Component props={{}} state="success" />,
    );

    expect(container.querySelector('[data-slot="mobius-loop-icon"]')).toHaveAttribute(
      'width',
      '64',
    );
  });
});
