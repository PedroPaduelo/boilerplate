import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  dashboardLayoutFixture,
  dashboardDataPayloadFixture,
} from '@dashboards/contracts';
import type { DashboardLayout } from '@dashboards/contracts';
import { DashboardRenderer } from './dashboard-renderer';
import { BlockRenderer } from './block-renderer';

describe('render-engine (DashboardRenderer + BlockRenderer)', () => {
  it('renderiza a fixture dashboardLayoutFixture sem crashar', () => {
    const { container } = render(
      <DashboardRenderer
        layout={dashboardLayoutFixture}
        data={dashboardDataPayloadFixture}
      />,
    );
    // uma célula por bloco do layout
    const totalBlocks = dashboardLayoutFixture.rows.reduce(
      (n, r) => n + r.blocks.length,
      0,
    );
    expect(container.querySelectorAll('[data-slot="dashboard-cell"]')).toHaveLength(
      totalBlocks,
    );
    // blocos da base ainda não implementados (T-I) → placeholder, sem crash
    expect(
      container.querySelectorAll('[data-slot="block-unknown"]').length,
    ).toBeGreaterThan(0);
    // filtros renderizados
    expect(container.querySelectorAll('[data-slot="dashboard-filter"]')).toHaveLength(
      dashboardLayoutFixture.filters.length,
    );
  });

  it('renderiza um bloco registrado (__example) resolvido pelo registry', () => {
    const layout: DashboardLayout = {
      filters: [],
      rows: [
        {
          id: 'row_demo',
          blocks: [
            { id: 'blk_demo', type: '__example', span: 12, props: { label: 'Olá F0.4' } },
          ],
        },
      ],
    };
    render(<DashboardRenderer layout={layout} />);
    expect(screen.getByText('Olá F0.4')).toBeInTheDocument();
  });

  it('BlockRenderer mostra placeholder para tipo desconhecido', () => {
    const { container } = render(
      <BlockRenderer block={{ id: 'x', type: 'nao_existe', span: 6 }} />,
    );
    expect(container.querySelector('[data-slot="block-unknown"]')).not.toBeNull();
  });
});
