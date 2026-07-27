/**
 * Regressão do bloco `tooltip_card` após a migração para o `Tooltip` do
 * Astryx: o gatilho continua visível e a dica só aparece na interação.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';

afterEach(() => cleanup());

describe('bloco tooltip_card', () => {
  it('mostra o gatilho como botão acessível', () => {
    renderWithProviders(
      <Component
        props={{ triggerLabel: 'Detalhes do contribuinte', content: 'CPF/CNPJ' }}
        state="success"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Detalhes do contribuinte' }),
    ).toBeInTheDocument();
  });

  it('o texto da prop chega ao conteúdo da dica', () => {
    renderWithProviders(
      <Component
        props={{ triggerLabel: 'Ver', content: 'Situação cadastral' }}
        state="success"
      />,
    );

    expect(screen.getByText('Situação cadastral')).toBeInTheDocument();
  });
});
