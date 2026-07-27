/**
 * Regressão do bloco `sheet` após a migração para o `Dialog` do Astryx: o
 * gatilho continua abrindo o painel, e os sub-blocos continuam sendo
 * renderizados DENTRO dele.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Block } from '@dashboards/contracts';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';

afterEach(() => cleanup());

const child = { id: 'filho-1', type: 'kpi' } as Block;

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

  it('abre o painel com título e sub-blocos ao clicar no gatilho', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <Component
        props={{ triggerLabel: 'Ver detalhamento', title: 'Detalhe da arrecadação' }}
        state="success"
        childBlocks={[child]}
        renderChild={(block) => <p>conteúdo de {block.id}</p>}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Ver detalhamento' }));

    expect(container.querySelector('dialog')).toHaveAttribute('open');
    expect(screen.getByText('Detalhe da arrecadação')).toBeInTheDocument();
    expect(screen.getByText('conteúdo de filho-1')).toBeInTheDocument();
  });

  it('sem título, o painel herda o nome do gatilho (nome acessível)', () => {
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
