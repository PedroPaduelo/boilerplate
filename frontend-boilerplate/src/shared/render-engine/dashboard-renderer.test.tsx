import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import {
  dashboardLayoutFixture,
  dashboardDataPayloadFixture,
} from '@dashboards/contracts';
import type { DashboardLayout } from '@dashboards/contracts';
import { renderWithProviders } from '@/test/render';
import { DashboardRenderer } from './dashboard-renderer';
import { BlockRenderer } from './block-renderer';

describe('render-engine (DashboardRenderer + BlockRenderer)', () => {
  it('renderiza a fixture dashboardLayoutFixture sem crashar', () => {
    const { container } = renderWithProviders(
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
    // T-I implementou os blocos da base → nenhum aviso de tipo desconhecido
    expect(screen.queryByText('Bloco não implementado')).not.toBeInTheDocument();
    // um bloco narrativo (title) renderiza seu texto direto do layout
    expect(screen.getByText('Dívida Ativa — 2026')).toBeInTheDocument();
    // filtros renderizados como tokens
    expect(screen.getAllByTestId('dashboard-filter')).toHaveLength(
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
    renderWithProviders(<DashboardRenderer layout={layout} />);
    expect(screen.getByText('Olá F0.4')).toBeInTheDocument();
  });

  it('o título da linha vira um heading acessível', () => {
    const layout: DashboardLayout = {
      filters: [],
      rows: [
        {
          id: 'row_titulada',
          title: 'Execução orçamentária',
          blocks: [{ id: 'blk_demo', type: '__example', span: 6 }],
        },
      ],
    };
    renderWithProviders(<DashboardRenderer layout={layout} />);
    expect(
      screen.getByRole('heading', { name: 'Execução orçamentária' }),
    ).toBeInTheDocument();
  });

  it('BlockRenderer avisa (sem quebrar a tela) em tipo desconhecido', () => {
    renderWithProviders(
      <BlockRenderer block={{ id: 'x', type: 'nao_existe', span: 6 }} />,
    );
    expect(screen.getByText('Bloco não implementado')).toBeInTheDocument();
    expect(screen.getByText(/nao_existe/)).toBeInTheDocument();
  });

  it('bloco com dataContract e sem resultado mostra esqueleto, não área em branco', () => {
    const { container } = renderWithProviders(
      <BlockRenderer block={{ id: 'blk_kpi', type: 'kpi', span: 3 }} />,
    );
    const block = container.querySelector('[data-slot="block"]');
    expect(block?.getAttribute('data-block-state')).toBe('skeleton');
    expect(container.querySelector('[data-slot="block-skeleton"]')).not.toBeNull();
  });

  it('bloco em erro mostra a mensagem do backend em um banner', () => {
    renderWithProviders(
      <BlockRenderer
        block={{ id: 'blk_kpi', type: 'kpi', span: 3 }}
        result={{
          blockId: 'blk_kpi',
          state: 'error',
          error: { message: 'Timeout na consulta' },
        }}
      />,
    );
    expect(screen.getByText('Erro ao carregar o bloco')).toBeInTheDocument();
    expect(screen.getByText('Timeout na consulta')).toBeInTheDocument();
  });

  it('bloco com sucesso vazio mostra o estado vazio', () => {
    renderWithProviders(
      <BlockRenderer
        block={{ id: 'blk_tabela', type: 'table', span: 12 }}
        result={{ blockId: 'blk_tabela', state: 'success', data: [] }}
      />,
    );
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });
});
