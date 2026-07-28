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

/**
 * As regras de composição chegando à TELA — o mesmo que `block-grid.test.tsx`
 * prova na unidade, aqui prova no caminho que o dashboard percorre de verdade
 * (layout JSON → linha → célula), inclusive dentro de um container aninhado.
 */
describe('DashboardRenderer — composição das linhas', () => {
  /** Duas famílias diferentes com spans desiguais: o caso da queixa. */
  const layoutDesigual: DashboardLayout = {
    filters: [],
    rows: [
      {
        id: 'row_graficos',
        blocks: [
          { id: 'blk_serie', type: 'line_chart', span: 7 },
          { id: 'blk_rosca', type: 'donut', span: 5 },
        ],
      },
      {
        id: 'row_kpis',
        blocks: [
          { id: 'blk_k1', type: 'kpi', span: 3 },
          { id: 'blk_k2', type: 'kpi', span: 3 },
          { id: 'blk_k3', type: 'kpi', span: 3 },
          { id: 'blk_k4', type: 'kpi', span: 3 },
        ],
      },
    ],
  };

  function gridsOf(container: HTMLElement): HTMLElement[] {
    return [...container.querySelectorAll<HTMLElement>('[data-slot="dashboard-grid"]')];
  }

  it('spans desiguais na mesma linha não viram larguras desiguais', () => {
    const { container } = renderWithProviders(
      <DashboardRenderer layout={layoutDesigual} />,
    );

    const cells = container.querySelectorAll('[data-slot="dashboard-cell"]');
    for (const cell of cells) {
      // Nenhuma célula reivindica colunas próprias — todas ocupam uma faixa.
      expect((cell as HTMLElement).style.gridColumn).toBe('');
    }
  });

  it('cada linha recebe o degrau de altura da sua própria família', () => {
    const { container } = renderWithProviders(
      <DashboardRenderer layout={layoutDesigual} />,
    );

    const [graficos, kpis] = gridsOf(container);
    // A linha de séries é alta; a de cartões de número é compacta. Antes as
    // duas herdavam a altura do bloco mais alto que caísse ali.
    expect(graficos.dataset.blockGridRowHeight).toBe('tall');
    expect(kpis.dataset.blockGridRowHeight).toBe('compact');
  });

  it('e todas as células da MESMA linha ficam com a mesma altura', () => {
    const { container } = renderWithProviders(
      <DashboardRenderer layout={layoutDesigual} />,
    );

    for (const grid of gridsOf(container)) {
      const alturas = [...grid.children].map(
        (cell) => (cell as HTMLElement).style.minHeight,
      );
      expect(new Set(alturas).size).toBe(1);
    }
  });

  it('a tela pode restaurar o mosaico assimétrico de propósito', () => {
    const { container } = renderWithProviders(
      <DashboardRenderer layout={layoutDesigual} itemSizing="span" />,
    );

    const [primeira] = container.querySelectorAll('[data-slot="dashboard-cell"]');
    expect((primeira as HTMLElement).style.gridColumn).toBe('span 7');
  });

  it('um container aninhado herda a grade das PRÓPRIAS props', () => {
    // O `grid` declara `columns: 2`; o motor monta a grade dos filhos com isso
    // sem que o componente do bloco precise fazer nada.
    const layout: DashboardLayout = {
      filters: [],
      rows: [
        {
          id: 'row_container',
          blocks: [
            {
              id: 'blk_grid',
              type: 'grid',
              span: 12,
              props: { columns: 2 },
              blocks: [
                { id: 'blk_a', type: 'bar_chart', span: 6 },
                { id: 'blk_b', type: 'donut', span: 6 },
                { id: 'blk_c', type: 'bar_list', span: 6 },
              ],
            },
          ],
        },
      ],
    };

    const { container } = renderWithProviders(<DashboardRenderer layout={layout} />);

    const inner = container.querySelector('[data-slot="block-children"]') as HTMLElement;
    expect(inner.style.getPropertyValue('--x-gridTemplateColumns')).toContain('/ 2)');
    expect(container.querySelectorAll('[data-slot="block-child-cell"]')).toHaveLength(3);
  });
});

/**
 * A altura declarada no LAYOUT tem de chegar à tela pelo caminho de produção —
 * `DashboardRenderer` → `BlockGrid` → célula. O `BlockGrid` já é testado
 * isolado; o que se prova aqui é a LIGAÇÃO: sem ela, o campo existiria no
 * contrato, seria salvo pelo editor e não faria nada para quem lê o dashboard.
 */
describe('DashboardRenderer — altura declarada na linha', () => {
  const comAltura: DashboardLayout = {
    filters: [],
    rows: [
      {
        id: 'row_alta',
        height: 620,
        blocks: [
          { id: 'b1', type: 'bar_chart', span: 6 },
          { id: 'b2', type: 'bar_chart', span: 6 },
        ],
      },
      {
        id: 'row_derivada',
        blocks: [{ id: 'b3', type: 'kpi', span: 12 }],
      },
    ],
  } as unknown as DashboardLayout;

  it('a altura da linha vale para todas as células dela', () => {
    const { container } = renderWithProviders(<DashboardRenderer layout={comAltura} />);
    const cells = [
      ...container.querySelectorAll('[data-slot="dashboard-cell"]'),
    ] as HTMLElement[];
    expect(cells[0].style.minHeight).toBe('620px');
    expect(cells[1].style.minHeight).toBe('620px');
  });

  it('linha sem altura declarada continua derivando do tipo (nada muda para o legado)', () => {
    const { container } = renderWithProviders(<DashboardRenderer layout={comAltura} />);
    const grids = [
      ...container.querySelectorAll('[data-slot="dashboard-grid"]'),
    ] as HTMLElement[];
    // A linha com altura do autor anuncia `custom` — não há degrau a nomear.
    expect(grids[0].dataset.blockGridRowHeight).toBe('custom');
    /*
     * A segunda linha tem um único bloco de largura total, e o degrau da GRADE
     * ali é `auto` de propósito: quem está sozinho na faixa não divide altura
     * com ninguém, então a célula usa o degrau do próprio tipo (KPI → 160px).
     * O que importa para o usuário é a altura da CÉLULA, e é ela que se afere.
     */
    const cells = [
      ...container.querySelectorAll('[data-slot="dashboard-cell"]'),
    ] as HTMLElement[];
    expect(cells[2].style.minHeight).toBe('160px');
  });
});
