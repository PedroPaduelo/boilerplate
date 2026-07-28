/**
 * DADOS DE BORDA nos blocos de escalar, ranking, composição e tabela.
 *
 * O catálogo é montado por um agente a partir de uma consulta SQL: o dado que
 * chega não é a fixture bonita do preview. Ele vem vazio (filtro sem
 * resultado), com `null` no meio (LEFT JOIN), com uma categoria só, com trinta
 * categorias, ou com valor acima da escala declarada. Nenhum desses casos pode
 * virar tela branca, `NaN` desenhado ou exceção — e nenhum deles aparece na
 * auditoria de props, que só percorre valores de PROP.
 *
 * Este arquivo vive junto dos outros testes transversais de gráfico (como o de
 * espessura de barra de lista, que também importa blocos do catálogo): a regra
 * afirmada aqui é da FAMÍLIA, não de um bloco.
 */
import type { ComponentType } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition as barList } from '@/shared/render-engine/catalog/bar_list/component';
import { definition as dataTable } from '@/shared/render-engine/catalog/data_table/component';
import { definition as donut } from '@/shared/render-engine/catalog/donut/component';
import { definition as invoiceTable } from '@/shared/render-engine/catalog/invoice_table/component';
import { definition as kpi } from '@/shared/render-engine/catalog/kpi/component';
import { definition as leaderboard } from '@/shared/render-engine/catalog/leaderboard/component';
import { definition as metricGlow } from '@/shared/render-engine/catalog/metric_glow/component';
import { definition as progressBar } from '@/shared/render-engine/catalog/progress_bar/component';
import { definition as progressCircle } from '@/shared/render-engine/catalog/progress_circle/component';
import { definition as radialGauge } from '@/shared/render-engine/catalog/radial_gauge/component';
import { definition as statTile } from '@/shared/render-engine/catalog/stat_tile/component';
import { definition as table } from '@/shared/render-engine/catalog/table/component';

/**
 * As definições têm genéricos diferentes e `BlockComponent` é contravariante em
 * `data`: uma lista tipada com o genérico neutro não aceitaria nenhuma delas.
 * O que estes casos verificam não olha para o tipo, e sim para o que aparece na
 * tela — então o componente entra como uma função de render só.
 */
type Draw = (data: unknown, props?: Record<string, unknown>) => HTMLElement;

/** Assinatura comum a todo bloco do catálogo, sem os genéricos de cada um. */
type AnyBlock = ComponentType<{ props: unknown; data: unknown; state: string }>;

const draw =
  (definition: { Component: unknown }): Draw =>
  (data, props = {}) => {
    const Block = definition.Component as AnyBlock;
    const { container } = renderWithProviders(
      <Block props={props} data={data} state="success" />,
    );
    return container;
  };

/** Categórico com buracos — o LEFT JOIN que não achou par. */
const WITH_NULLS = [
  { label: 'IPTU', value: 4200 },
  { label: 'ISS', value: null },
  { label: 'ITBI', value: 0 },
];

/** Mais categorias do que cores na paleta — o ciclo tem de dar a volta. */
const MANY = Array.from({ length: 30 }, (_, index) => ({
  label: `Categoria ${index + 1}`,
  value: (index + 1) * 137,
}));

const CATEGORICAL_BLOCKS: Array<[string, Draw]> = [
  ['donut', draw(donut)],
  ['bar_list', draw(barList)],
  ['leaderboard', draw(leaderboard)],
];

const SCALAR_BLOCKS: Array<[string, Draw]> = [
  ['progress_circle', draw(progressCircle)],
  ['progress_bar', draw(progressBar)],
  ['radial_gauge', draw(radialGauge)],
  ['kpi', draw(kpi)],
  ['stat_tile', draw(statTile)],
  ['metric_glow', draw(metricGlow)],
];

const TABLE_BLOCKS: Array<[string, Draw]> = [
  ['table', draw(table)],
  ['data_table', draw(dataTable)],
  ['invoice_table', draw(invoiceTable)],
];

// O setup não faz cleanup automático: sem isto, um caso enxerga o DOM do
// anterior e uma consulta por texto casa duas vezes.
afterEach(() => cleanup());

describe('categóricos — vazio, nulos, uma categoria e muitas', () => {
  it.each(CATEGORICAL_BLOCKS)('%s avisa quando a consulta não devolve linha', (_n, d) => {
    expect(d([]).textContent).toMatch(/sem dados/i);
  });

  it.each(CATEGORICAL_BLOCKS)('%s trata `null` como zero, sem escrever NaN', (_n, d) => {
    const container = d(WITH_NULLS);
    expect(container.textContent).toContain('IPTU');
    expect(container.textContent).not.toMatch(/NaN|undefined|null/);
  });

  it.each(CATEGORICAL_BLOCKS)('%s desenha com uma categoria só', (_n, d) => {
    const container = d([{ label: 'Único', value: 10 }]);
    expect(container.textContent).toContain('Único');
  });

  it.each(CATEGORICAL_BLOCKS)('%s cicla a paleta com 30 categorias', (_n, d) => {
    const container = d(MANY);
    expect(container.textContent).toContain('Categoria 30');
    expect(container.textContent).not.toMatch(/NaN/);
  });
});

describe('escalares — sem valor, zero, fora da escala e negativo', () => {
  it.each(SCALAR_BLOCKS)('%s não desenha zero quando o valor não veio', (_n, d) => {
    // Cravar zero mentiria a leitura: "sem dado" e "zero" são coisas
    // diferentes, e num medidor a diferença é a decisão que alguém vai tomar.
    expect(d({ value: null }).textContent).toMatch(/sem dados/i);
  });

  it.each(SCALAR_BLOCKS)('%s desenha o zero legítimo', (_n, d) => {
    expect(d({ value: 0, label: 'Meta' }).textContent).not.toMatch(/sem dados/i);
  });

  it.each(SCALAR_BLOCKS)('%s aguenta valor acima da escala sem estourar', (_n, d) => {
    const container = d({ value: 250, label: 'Acima' }, { max: 100 });
    expect(container.textContent).not.toMatch(/NaN/);
  });

  it.each(SCALAR_BLOCKS)('%s aguenta valor negativo', (_n, d) => {
    expect(d({ value: -40, label: 'Queda' }).textContent).not.toMatch(/NaN/);
  });
});

describe('tabelas — sem linha e com célula vazia', () => {
  const COLUMNS = [
    { key: 'label', label: 'Item', type: 'string' as const },
    { key: 'qty', label: 'Qtd.', type: 'number' as const },
    { key: 'unit', label: 'Valor', type: 'number' as const },
  ];

  it.each(TABLE_BLOCKS)('%s avisa quando não há linha', (_n, d) => {
    expect(d({ columns: COLUMNS, rows: [] }).textContent).toMatch(/sem|nenhum|vazi/i);
  });

  it.each(TABLE_BLOCKS)('%s desenha linha com célula nula sem escrever NaN', (_n, d) => {
    const container = d({
      columns: COLUMNS,
      rows: [{ label: 'Licença', qty: null, unit: 1200 }],
    });
    expect(container.textContent).toContain('Licença');
    expect(container.textContent).not.toMatch(/NaN/);
  });
});

describe('anel de progresso — a escala grampeia, não estoura', () => {
  it('valor acima do máximo fecha o anel em 100%, sem passar disso', () => {
    const container = draw(progressCircle)({ value: 250 }, { max: 100 });
    const bar = within(container).getByRole('progressbar');
    // O valor bruto continua anunciado (é o dado), mas o desenho para no fim
    // da escala — anel que passa de uma volta não quer dizer nada.
    expect(bar).toHaveAttribute('aria-valuenow', '250');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    // Anel fechado = nenhum pedaço do traço escondido.
    expect(
      container.querySelector('[data-slot="progress-circle-value"]'),
    ).toHaveAttribute('stroke-dashoffset', '0');
    // A leitura central (e o tooltip que a repete) dizem 100%, não 250%.
    expect(within(container).getAllByText('100%').length).toBeGreaterThan(0);
  });
});
