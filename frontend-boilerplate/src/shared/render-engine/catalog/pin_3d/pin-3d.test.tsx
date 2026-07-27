/**
 * Regressão do bloco `pin_3d`.
 *
 * O palco é enfeite; o que não pode sumir é o essencial: um link com nome
 * acessível, a etiqueta do pino visível (no efeito legado ela vivia dentro da
 * camada que só aparecia no hover) e o halo marcado como decorativo.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

const PROPS = {
  pinLabel: 'relatorios.gov.br',
  href: '/relatorios',
  title: 'Relatório de Arrecadação',
  description: 'Receita consolidada por tributo.',
};

afterEach(() => cleanup());

describe('bloco pin_3d', () => {
  it('mantém o link, o título e a etiqueta do pino visíveis', () => {
    renderWithProviders(<definition.Component props={PROPS} state="success" />);

    expect(
      screen.getByRole('link', { name: 'Relatório de Arrecadação' }),
    ).toHaveAttribute('href', '/relatorios');
    expect(screen.getByText('relatorios.gov.br')).toBeInTheDocument();
    expect(screen.getByText('Receita consolidada por tributo.')).toBeInTheDocument();
  });

  it('mantém o halo fora da árvore de acessibilidade', () => {
    const { container } = renderWithProviders(
      <definition.Component props={PROPS} state="success" />,
    );

    const halo = container.querySelector('[data-slot="pin-3d-halo"]');
    expect(halo).not.toBeNull();
    expect(halo).toHaveAttribute('aria-hidden', 'true');
  });
});
