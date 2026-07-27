/**
 * Regressão do bloco `tooltip_fluid` após a migração para o `Tooltip` do
 * Astryx: o gatilho continua visível e o `side` continua sendo aceito (agora
 * traduzido para o posicionamento lógico do DS).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';

afterEach(() => cleanup());

describe('bloco tooltip_fluid', () => {
  it('mostra o gatilho como botão acessível', () => {
    renderWithProviders(
      <Component
        props={{ triggerLabel: 'Passe o mouse', content: 'Receita acumulada' }}
        state="success"
      />,
    );

    expect(screen.getByRole('button', { name: 'Passe o mouse' })).toBeInTheDocument();
  });

  it('aceita qualquer lado sem quebrar', () => {
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      renderWithProviders(
        <Component props={{ triggerLabel: `Lado ${side}`, side }} state="success" />,
      );
      expect(screen.getByRole('button', { name: `Lado ${side}` })).toBeInTheDocument();
      cleanup();
    }
  });
});
