/**
 * Regressão do bloco `hover_card` após a migração para o `HoverCard` do
 * Astryx: o gatilho continua visível e acionável, e o conteúdo só aparece na
 * interação.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';

afterEach(() => cleanup());

describe('bloco hover_card', () => {
  it('mostra o gatilho como botão acessível', () => {
    renderWithProviders(
      <Component
        props={{ triggerLabel: '@prefeitura', title: 'Prefeitura', content: 'Portal' }}
        state="success"
      />,
    );

    expect(screen.getByRole('button', { name: '@prefeitura' })).toBeInTheDocument();
  });

  it('título e corpo chegam ao cartão flutuante', () => {
    renderWithProviders(
      <Component
        props={{
          triggerLabel: '@prefeitura',
          title: 'Prefeitura Municipal',
          content: 'Portal de indicadores.',
        }}
        state="success"
      />,
    );

    expect(screen.getByText('Prefeitura Municipal')).toBeInTheDocument();
    expect(screen.getByText('Portal de indicadores.')).toBeInTheDocument();
  });

  it('sem corpo, o cartão mostra apenas o título', () => {
    renderWithProviders(
      <Component
        props={{ triggerLabel: '@prefeitura', title: 'Prefeitura' }}
        state="success"
      />,
    );

    expect(screen.getByText('Prefeitura')).toBeInTheDocument();
  });
});
