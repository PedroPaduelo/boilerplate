/**
 * As REGRAS DE COMPOSIÇÃO do motor, travadas uma a uma.
 *
 * O que se verifica aqui é a DECLARAÇÃO de grade, não o pixel: em jsdom não há
 * layout, então medir largura devolveria zero para tudo e o teste passaria com
 * qualquer implementação. O que prova a regra é o que o componente escreveu —
 * o `grid-template-columns` do container e o `grid-column`/`min-height` de cada
 * célula. São exatamente os três lugares onde um tamanho desigual apareceria.
 *
 * O template de faixas viaja numa CSS var (`--x-gridTemplateColumns`) porque o
 * `Grid` do design system evita `style` inline para que overrides de tema
 * possam vencer — é o mesmo caminho que os testes do próprio DS inspecionam.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';
import type { Block } from '@dashboards/contracts';
import { renderWithProviders } from '@/test/render';
import { BlockGrid } from './block-grid';
import { readGridOptions } from './lib/layout-options';
import { BLOCK_ROW_HEIGHT } from './lib/block-sizing';

afterEach(() => cleanup());

/** Monta blocos a partir de `type`/`span`/`rowSpan` (o resto não importa aqui). */
function blocksOf(
  specs: { id: string; type: string; span?: number; rowSpan?: number }[],
): Block[] {
  return specs as unknown as Block[];
}

interface RenderOptions {
  columns?: number;
  rowHeight?: 'auto' | 'compact' | 'default' | 'tall';
  itemSizing?: 'equal' | 'span';
}

function renderGrid(blocks: Block[], options: RenderOptions = {}) {
  const view = renderWithProviders(
    <BlockGrid
      {...options}
      blocks={blocks}
      renderBlock={(block) => <p>bloco {block.id}</p>}
      slot="grade"
      cellSlot="celula"
    />,
  );
  const grid = view.container.querySelector('[data-slot="grade"]') as HTMLElement;
  const cells = [
    ...view.container.querySelectorAll('[data-slot="celula"]'),
  ] as HTMLElement[];
  return { ...view, grid, cells };
}

/** O `grid-template-columns` efetivo (o DS o publica numa CSS var). */
function template(grid: HTMLElement): string {
  return grid.style.getPropertyValue('--x-gridTemplateColumns');
}

/* ========================================================================== *
 * REGRA 1 — mesma linha, mesma LARGURA
 * ========================================================================== */

describe('BlockGrid — itens da mesma linha têm a mesma largura', () => {
  it('span desigual não vira largura desigual', () => {
    // O caso da queixa: dois gráficos irmãos escritos com 8 e 4 de 12 saíam
    // em 67% e 33% da linha.
    const { grid, cells } = renderGrid(
      blocksOf([
        { id: 'a', type: 'bar_chart', span: 8 },
        { id: 'b', type: 'donut', span: 4 },
      ]),
    );

    // Nenhuma célula reivindica um número de colunas próprio…
    expect(cells).toHaveLength(2);
    for (const cell of cells) {
      expect(cell.style.gridColumn).toBe('');
    }
    // …e as faixas do container são todas `1fr` (iguais por construção).
    expect(template(grid)).toContain(', 1fr)');
  });

  it('span: 12 continua pedindo a linha inteira', () => {
    const { cells } = renderGrid(
      blocksOf([
        { id: 'titulo', type: 'title', span: 12 },
        { id: 'a', type: 'kpi', span: 3 },
        { id: 'b', type: 'kpi', span: 3 },
      ]),
    );

    expect(cells[0].style.gridColumn).toBe('1 / -1');
    expect(cells[1].style.gridColumn).toBe('');
    expect(cells[2].style.gridColumn).toBe('');
  });

  it('o bloco de linha inteira não conta como faixa dos vizinhos', () => {
    // Com 1 full + 2 normais, as faixas devem ser DUAS — se o full entrasse na
    // conta, os dois vizinhos ficariam com um terço da linha cada.
    const { grid } = renderGrid(
      blocksOf([
        { id: 'full', type: 'data_table', span: 12 },
        { id: 'a', type: 'bar_chart', span: 6 },
        { id: 'b', type: 'donut', span: 6 },
      ]),
    );

    expect(template(grid)).toContain('/ 2)');
  });

  it('`columns` explícito fixa o número de faixas (pares que não viram trio)', () => {
    const { grid } = renderGrid(
      blocksOf([
        { id: 'a', type: 'bar_chart', span: 6 },
        { id: 'b', type: 'donut', span: 6 },
        { id: 'c', type: 'bar_list', span: 6 },
        { id: 'd', type: 'line_chart', span: 6 },
      ]),
      { columns: 2 },
    );

    expect(template(grid)).toContain('/ 2)');
  });
});

/* ========================================================================== *
 * REGRA 2 — a linha tem ALTURA definida
 * ========================================================================== */

describe('BlockGrid — a linha tem altura definida', () => {
  it('todas as células da linha recebem a MESMA altura', () => {
    const { cells } = renderGrid(
      blocksOf([
        { id: 'serie', type: 'line_chart', span: 6 },
        { id: 'rosca', type: 'donut', span: 6 },
      ]),
    );

    const alturas = cells.map((cell) => cell.style.minHeight);
    expect(new Set(alturas).size).toBe(1);
  });

  it('a altura é a do bloco mais exigente da linha — nunca um corte', () => {
    // `line_chart` é série (o degrau alto); `donut` é composição. A linha adota
    // o alto, senão a série não caberia.
    const { grid, cells } = renderGrid(
      blocksOf([
        { id: 'serie', type: 'line_chart', span: 6 },
        { id: 'rosca', type: 'donut', span: 6 },
      ]),
    );

    expect(grid.dataset.blockGridRowHeight).toBe('tall');
    expect(cells[0].style.minHeight).toBe(`${BLOCK_ROW_HEIGHT.tall}px`);
  });

  it('linha só de cartões de número é COMPACTA, não a altura de um gráfico', () => {
    const { grid, cells } = renderGrid(
      blocksOf([
        { id: 'k1', type: 'kpi', span: 3 },
        { id: 'k2', type: 'kpi', span: 3 },
        { id: 'k3', type: 'stat_tile', span: 3 },
        { id: 'k4', type: 'signal_card', span: 3 },
      ]),
    );

    expect(grid.dataset.blockGridRowHeight).toBe('compact');
    for (const cell of cells) {
      expect(cell.style.minHeight).toBe(`${BLOCK_ROW_HEIGHT.compact}px`);
    }
  });

  it('linha de composições fica no degrau intermediário', () => {
    const { grid, cells } = renderGrid(
      blocksOf([
        { id: 'rosca', type: 'donut', span: 6 },
        { id: 'lista', type: 'bar_list', span: 6 },
      ]),
    );

    expect(grid.dataset.blockGridRowHeight).toBe('default');
    expect(cells[0].style.minHeight).toBe(`${BLOCK_ROW_HEIGHT.default}px`);
  });

  it('linha só de texto NÃO reserva altura (reservar abriria um buraco)', () => {
    const { grid, cells } = renderGrid(
      blocksOf([
        { id: 't', type: 'title', span: 12 },
        { id: 'r', type: 'rich_text', span: 12 },
      ]),
    );

    expect(grid.dataset.blockGridRowHeight).toBe('auto');
    for (const cell of cells) {
      expect(cell.style.minHeight).toBe('');
    }
  });

  it('quem ocupa a linha inteira usa a SUA altura, não a do vizinho', () => {
    // Um título full-width em cima de dois gráficos estava herdando os 460px da
    // série — 460px de altura para uma linha de texto.
    const { cells } = renderGrid(
      blocksOf([
        { id: 'titulo', type: 'title', span: 12 },
        { id: 'a', type: 'line_chart', span: 6 },
        { id: 'b', type: 'donut', span: 6 },
      ]),
    );

    expect(cells[0].style.minHeight).toBe('');
    expect(cells[1].style.minHeight).toBe(`${BLOCK_ROW_HEIGHT.tall}px`);
    expect(cells[2].style.minHeight).toBe(`${BLOCK_ROW_HEIGHT.tall}px`);
  });

  it('em coluna única cada bloco fica com a própria altura', () => {
    // Aqui não há vizinho de linha: uniformizar seria esticar o título até a
    // altura da tabela.
    const { cells } = renderGrid(
      blocksOf([
        { id: 'titulo', type: 'title', span: 12 },
        { id: 'kpi', type: 'kpi', span: 12 },
        { id: 'serie', type: 'line_chart', span: 12 },
      ]),
      { columns: 1 },
    );

    expect(cells[0].style.minHeight).toBe('');
    expect(cells[1].style.minHeight).toBe(`${BLOCK_ROW_HEIGHT.compact}px`);
    expect(cells[2].style.minHeight).toBe(`${BLOCK_ROW_HEIGHT.tall}px`);
  });

  it('`rowHeight` explícito manda sobre o degrau derivado — e vale para todos', () => {
    const { grid, cells } = renderGrid(
      blocksOf([
        { id: 'titulo', type: 'title', span: 12 },
        { id: 'serie', type: 'line_chart', span: 6 },
      ]),
      { rowHeight: 'compact' },
    );

    expect(grid.dataset.blockGridRowHeight).toBe('compact');
    for (const cell of cells) {
      expect(cell.style.minHeight).toBe(`${BLOCK_ROW_HEIGHT.compact}px`);
    }
  });

  it('a célula estica o conteúdo até a altura da linha', () => {
    // Sem isto o card dentro da célula para de crescer na altura do próprio
    // conteúdo e dois vizinhos terminam com molduras de tamanhos diferentes.
    const { cells } = renderGrid(blocksOf([{ id: 'a', type: 'bar_chart', span: 6 }]));

    expect(cells[0].className).toContain('h-full');
  });
});

/* ========================================================================== *
 * REGRA 3 — COLAPSO previsível em telas menores
 * ========================================================================== */

describe('BlockGrid — colapso em telas menores', () => {
  it('as faixas são declaradas por largura mínima, então caem sozinhas', () => {
    const { grid } = renderGrid(
      blocksOf([
        { id: 'a', type: 'bar_chart', span: 4 },
        { id: 'b', type: 'donut', span: 4 },
        { id: 'c', type: 'bar_list', span: 4 },
      ]),
    );

    const value = template(grid);
    // `auto-fill` = o navegador encaixa quantas faixas couberem…
    expect(value).toContain('auto-fill');
    // …cada uma com um piso de largura (o que dispara o colapso)…
    expect(value).toContain('max(280px');
    // …e `min(100%, …)` garante que a última coluna caiba na tela estreita…
    expect(value).toContain('min(100%');
    // …com o máximo em `1fr`, para a coluna solta esticar em vez de deixar
    // espaço morto à direita.
    expect(value).toContain(', 1fr)');
  });

  it('o teto de faixas é 3 para gráficos e 4 para cartões de número', () => {
    const graficos = renderGrid(
      blocksOf(
        ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, type: 'bar_chart', span: 2 })),
      ),
    );
    expect(template(graficos.grid)).toContain('/ 3)');

    cleanup();

    const cartoes = renderGrid(
      blocksOf(['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, type: 'kpi', span: 2 }))),
    );
    expect(template(cartoes.grid)).toContain('/ 4)');
  });

  it('um bloco sozinho ocupa a linha toda', () => {
    const { grid } = renderGrid(blocksOf([{ id: 'unico', type: 'bar_chart', span: 6 }]));

    expect(template(grid)).toContain('/ 1)');
  });
});

/* ========================================================================== *
 * REGRA 4 — o mosaico assimétrico é OPT-IN
 * ========================================================================== */

describe('BlockGrid — mosaico assimétrico só quando pedido', () => {
  it('`itemSizing: "span"` restaura as 12 colunas e o `span` de cada bloco', () => {
    const { grid, cells } = renderGrid(
      blocksOf([
        { id: 'a', type: 'bar_chart', span: 8, rowSpan: 2 },
        { id: 'b', type: 'kpi', span: 4 },
      ]),
      { itemSizing: 'span' },
    );

    expect(template(grid)).toBe('repeat(12, 1fr)');
    expect(cells[0].style.gridColumn).toBe('span 8');
    expect(cells[0].style.gridRow).toBe('span 2');
    expect(cells[1].style.gridColumn).toBe('span 4');
  });

  it('no modo padrão o `rowSpan` é ignorado — altura desigual é o que se evita', () => {
    const { cells } = renderGrid(
      blocksOf([
        { id: 'a', type: 'bar_chart', span: 6, rowSpan: 2 },
        { id: 'b', type: 'donut', span: 6 },
      ]),
    );

    expect(cells[0].style.gridRow).toBe('');
  });

  it('o modo escolhido fica declarado no DOM (rastreável na inspeção)', () => {
    const { grid } = renderGrid(blocksOf([{ id: 'a', type: 'kpi', span: 6 }]));
    expect(grid.dataset.blockGridSizing).toBe('equal');
  });
});

/* ========================================================================== *
 * As props do container viram opções de grade
 * ========================================================================== */

describe('readGridOptions', () => {
  it('lê o vocabulário de grade das props do bloco container', () => {
    expect(
      readGridOptions({
        columns: 2,
        gap: 'lg',
        align: 'center',
        rowHeight: 'compact',
        itemSizing: 'span',
        title: 'irrelevante',
      }),
    ).toEqual({
      columns: 2,
      gap: 'lg',
      align: 'center',
      rowHeight: 'compact',
      itemSizing: 'span',
    });
  });

  it('ausência continua sendo ausência — nada é preenchido por conta própria', () => {
    // É o que permite ao motor derivar colunas e altura dos filhos: um default
    // inventado aqui seria indistinguível de uma escolha do autor.
    expect(readGridOptions({ title: 'Seção' })).toEqual({});
  });

  it('valor fora do vocabulário é ignorado, não derruba o bloco', () => {
    // As props vêm de um JSON gerado por IA: degradar para o padrão é o
    // comportamento certo.
    expect(
      readGridOptions({ gap: 'enorme', rowHeight: 'gigante', itemSizing: 'livre' }),
    ).toEqual({});
  });

  it('`columns` é preso à faixa aceita pelo contrato (1..12)', () => {
    expect(readGridOptions({ columns: 0 }).columns).toBe(1);
    expect(readGridOptions({ columns: 99 }).columns).toBe(12);
  });
});
