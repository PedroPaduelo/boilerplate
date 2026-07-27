/**
 * Regressão do bloco `collapsible_block` após a migração para o `Collapsible`
 * do Astryx: o cabeçalho continua sendo o gatilho e `defaultOpen` continua
 * mandando no estado inicial.
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

  it('sem filhos, mostra o placeholder ilustrativo', () => {
    renderWithProviders(<Component props={{ title: 'Seção' }} state="success" />);

    expect(screen.getByText('Gráfico')).toBeInTheDocument();
    expect(screen.getByText('Tabela')).toBeInTheDocument();
  });
});
