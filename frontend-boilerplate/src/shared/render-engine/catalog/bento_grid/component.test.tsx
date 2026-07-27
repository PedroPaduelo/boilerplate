/**
 * Regressão do bloco `bento_grid` após a troca do `style` de grid pelo
 * `Grid`/`GridSpan` do Astryx: cada filho continua sendo renderizado na sua
 * célula do mosaico.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import type { Block } from '@dashboards/contracts';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';

afterEach(() => cleanup());

const children = [
  { id: 'destaque', type: 'bar_chart', span: 8, rowSpan: 2 },
  { id: 'kpi', type: 'kpi', span: 4 },
] as unknown as Block[];

describe('bloco bento_grid', () => {
  it('renderiza cada sub-bloco numa célula do mosaico', () => {
    const { container } = renderWithProviders(
      <Component
        props={{ columns: 12 }}
        state="success"
        childBlocks={children}
        renderChild={(block) => <p>bloco {block.id}</p>}
      />,
    );

    expect(screen.getByText('bloco destaque')).toBeInTheDocument();
    expect(screen.getByText('bloco kpi')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="bento-cell"]')).toHaveLength(2);
  });

  it('filho sem span ocupa a linha inteira', () => {
    const solto = [{ id: 'solo', type: 'kpi' }] as unknown as Block[];
    const { container } = renderWithProviders(
      <Component
        props={{ columns: 4 }}
        state="success"
        childBlocks={solto}
        renderChild={(block) => <p>bloco {block.id}</p>}
      />,
    );

    expect(container.querySelectorAll('[data-slot="bento-cell"]')).toHaveLength(1);
    expect(screen.getByText('bloco solo')).toBeInTheDocument();
  });

  it('sem filhos, mostra o mosaico ilustrativo', () => {
    renderWithProviders(<Component props={{}} state="success" />);

    expect(screen.getByText('Gráfico em destaque')).toBeInTheDocument();
  });
});
