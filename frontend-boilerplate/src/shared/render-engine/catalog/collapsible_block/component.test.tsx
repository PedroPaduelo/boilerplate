/**
 * Regressão do bloco `collapsible_block`: o cabeçalho continua sendo o gatilho,
 * `defaultOpen` continua mandando no estado inicial — e o bloco deixou de vir
 * embrulhado num card por padrão.
 *
 * O estado é verificado por `aria-expanded` (contrato de acessibilidade do
 * disclosure), não por CSS: o DS mantém o corpo montado e o esconde por
 * estilo, então "sumiu do DOM" seria a asserção errada.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';
import { manifest } from './manifest';

afterEach(() => cleanup());

describe('bloco collapsible_block', () => {
  it('aberto por padrão: gatilho expandido e corpo presente', () => {
    renderWithProviders(
      <Component props={{ title: 'Detalhes da apuração' }} state="success">
        <p>corpo da seção</p>
      </Component>,
    );

    expect(screen.getByRole('button', { name: /Detalhes da apuração/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('corpo da seção')).toBeInTheDocument();
  });

  it('defaultOpen=false começa recolhido e o gatilho expande', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Component props={{ title: 'Detalhes', defaultOpen: false }} state="success">
        <p>corpo da seção</p>
      </Component>,
    );

    const trigger = screen.getByRole('button', { name: /Detalhes/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('corpo da seção')).toBeInTheDocument();
  });

  it('NÃO é um card por padrão; card continua disponível sob demanda', () => {
    const { container } = renderWithProviders(
      <Component props={{ title: 'Detalhes' }} state="success">
        <p>corpo</p>
      </Component>,
    );
    expect(
      container
        .querySelector('[data-slot="collapsible-block"]')
        ?.getAttribute('data-block-surface'),
    ).toBe('plain');
    expect(manifest.defaultProps.variant).toBe('plain');

    cleanup();

    const card = renderWithProviders(
      <Component props={{ title: 'Detalhes', variant: 'card' }} state="success">
        <p>corpo</p>
      </Component>,
    );
    expect(
      card.container
        .querySelector('[data-slot="collapsible-block"]')
        ?.getAttribute('data-block-surface'),
    ).toBe('card');
  });

  it('sem título, o gatilho ainda tem nome acessível — mas não vem do manifesto', () => {
    // O recuo mora no render, e não em `defaultProps`: assim "sem título"
    // continua distinguível de "título escolhido pelo autor".
    renderWithProviders(
      <Component props={{}} state="success">
        <p>corpo</p>
      </Component>,
    );

    expect(screen.getByRole('button', { name: /Detalhes/ })).toBeInTheDocument();
    expect(manifest.defaultProps).not.toHaveProperty('title');
  });

  it('sem filhos, mostra o placeholder ilustrativo', () => {
    renderWithProviders(<Component props={{ title: 'Seção' }} state="success" />);

    expect(screen.getByText('Gráfico')).toBeInTheDocument();
    expect(screen.getByText('Tabela')).toBeInTheDocument();
  });
});
