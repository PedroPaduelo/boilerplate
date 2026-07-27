/**
 * Regressão do bloco `resizable_panels` após a migração para `Layout` +
 * `LayoutPanel` + `ResizeHandle`: cada filho continua virando um painel e
 * continua existindo uma divisória arrastável entre eles.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import type { Block } from '@dashboards/contracts';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';

afterEach(() => cleanup());

const children = [
  { id: 'filtros', type: 'donut' },
  { id: 'resultado', type: 'bar_chart' },
] as unknown as Block[];

describe('bloco resizable_panels', () => {
  it('cada sub-bloco vira um painel, com divisória entre eles', () => {
    renderWithProviders(
      <Component
        props={{ direction: 'horizontal', defaultSizes: [30, 70] }}
        state="success"
        childBlocks={children}
        renderChild={(block) => <p>painel {block.id}</p>}
      />,
    );

    expect(screen.getByText('painel filtros')).toBeInTheDocument();
    expect(screen.getByText('painel resultado')).toBeInTheDocument();
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  it('a divisória é orientada pelo eixo do split', () => {
    renderWithProviders(
      <Component
        props={{ direction: 'vertical' }}
        state="success"
        childBlocks={children}
        renderChild={(block) => <p>painel {block.id}</p>}
      />,
    );

    expect(screen.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    );
  });

  it('três filhos = dois painéis arrastáveis + o conteúdo', () => {
    const three = [...children, { id: 'notas', type: 'rich_text' }] as unknown as Block[];
    renderWithProviders(
      <Component
        props={{}}
        state="success"
        childBlocks={three}
        renderChild={(block) => <p>painel {block.id}</p>}
      />,
    );

    expect(screen.getAllByRole('separator')).toHaveLength(2);
    expect(screen.getByText('painel notas')).toBeInTheDocument();
  });

  it('sem filhos, mostra os dois painéis ilustrativos', () => {
    renderWithProviders(<Component props={{}} state="success" />);

    expect(screen.getByText('Painel A')).toBeInTheDocument();
    expect(screen.getByText('Painel B')).toBeInTheDocument();
  });
});
