/**
 * Regressão do bloco `sheet`: o gatilho continua abrindo o painel e os
 * sub-blocos continuam sendo renderizados DENTRO dele.
 *
 * O conteúdo passou a chegar por `children` — a grade já montada pelo motor —
 * em vez de o próprio bloco empilhar os filhos. Era o único container do
 * catálogo cujo conteúdo não tinha as garantias de grade.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';
import { manifest } from './manifest';

afterEach(() => cleanup());

describe('bloco sheet', () => {
  it('começa fechado: só o gatilho está ativo', () => {
    const { container } = renderWithProviders(
      <Component
        props={{ triggerLabel: 'Ver detalhamento', title: 'Detalhe' }}
        state="success"
      />,
    );

    expect(screen.getByRole('button', { name: 'Ver detalhamento' })).toBeInTheDocument();
    expect(container.querySelector('dialog')).not.toHaveAttribute('open');
  });

  it('abre o painel com título e a grade de sub-blocos ao clicar no gatilho', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <Component
        props={{ triggerLabel: 'Ver detalhamento', title: 'Detalhe da arrecadação' }}
        state="success"
      >
        <p>grade de sub-blocos</p>
      </Component>,
    );

    await user.click(screen.getByRole('button', { name: 'Ver detalhamento' }));

    expect(container.querySelector('dialog')).toHaveAttribute('open');
    expect(screen.getByText('Detalhe da arrecadação')).toBeInTheDocument();
    expect(screen.getByText('grade de sub-blocos')).toBeInTheDocument();
  });

  it('sem título, o painel herda o nome do gatilho (nome acessível)', () => {
    // E o título NÃO tem default de fábrica: o manifesto trazia
    // 'Detalhes do indicador', que aparecia em todo painel do produto.
    expect(manifest.defaultProps).not.toHaveProperty('title');
    expect(manifest.defaultProps).not.toHaveProperty('description');

    renderWithProviders(
      <Component props={{ triggerLabel: 'Abrir apuração' }} state="success" />,
    );

    // Duas ocorrências: o rótulo do botão e o título do painel.
    expect(screen.getAllByText('Abrir apuração').length).toBeGreaterThan(1);
  });

  it('sem filhos, o painel traz o placeholder ilustrativo', () => {
    renderWithProviders(
      <Component props={{ triggerLabel: 'Abrir painel' }} state="success" />,
    );

    expect(screen.getByText('Gráfico de detalhe')).toBeInTheDocument();
  });
});
