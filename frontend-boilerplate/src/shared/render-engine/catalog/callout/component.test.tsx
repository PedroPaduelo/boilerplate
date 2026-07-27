/**
 * Regressão do bloco `callout` após a migração para o `Banner` do Astryx.
 *
 * O ponto sensível são as props de cor: elas viraram TONS do design system, e
 * valores sem equivalente (hex, gradiente) precisam degradar para o tom do
 * `variant` — nunca pintar valor mágico.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';

afterEach(() => cleanup());

describe('bloco callout', () => {
  it('variante de sucesso apenas anuncia (role=status)', () => {
    renderWithProviders(
      <Component
        props={{
          variant: 'success',
          title: 'Meta atingida',
          description: 'Superou em 8%.',
        }}
        state="success"
      />,
    );

    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Meta atingida');
    expect(banner).toHaveTextContent('Superou em 8%.');
  });

  it('boxColor sobrescreve o tom do variant (erro interrompe)', () => {
    renderWithProviders(
      <Component
        props={{ variant: 'success', title: 'Inadimplência alta', boxColor: 'error' }}
        state="success"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Inadimplência alta');
  });

  it('nome de cor legado cai no tom equivalente', () => {
    renderWithProviders(
      <Component
        props={{ title: 'Atenção', boxColor: 'bg-amber-500' }}
        state="success"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Atenção');
  });

  it('cor crua sem equivalente é ignorada — vale o variant', () => {
    renderWithProviders(
      <Component
        props={{ variant: 'success', title: 'Turquesa não é tom', boxColor: '#40E0D0' }}
        state="success"
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Turquesa não é tom');
  });
});
