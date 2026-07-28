/**
 * Regressão do bloco `h_bar_chart` depois da repaginação (§8 da referência).
 *
 * O que este arquivo trava:
 * 1. OS QUATRO ESTADOS — carregando, sem dados, erro e sucesso. Barra vazia em
 *    silêncio era o defeito clássico do bloco antigo.
 * 2. LEITURA SEM VER — as categorias vivem dentro do SVG (que em jsdom nem
 *    chega a ter tamanho), então o bloco publica os mesmos números duas vezes:
 *    no resumo do `ChartFrame` e como tabela de verdade.
 * 3. CONTRATO COMUM — todo texto desenhado passa por `chartPlainText` com o
 *    escopo de `buildChartScope(data)`: markdown some, `{{variável}}` resolve.
 * 4. FORMATO DO VALOR — o enum do manifesto continua valendo, e o insight de
 *    rodapé repete o número na MESMA unidade da barra.
 * 5. CONFORMIDADE VISUAL (§8) — cor, raio, traço, altura da barra, grade e
 *    hover conferidos no SVG desenhado. É o que impede a repaginação de
 *    regredir em silêncio para o visual antigo.
 *
 * Consultas por papel acessível — nunca por classe do design system (o StyleX
 * gera nomes novos a cada build). As classes consultadas na parte 5 são as do
 * RECHARTS (`recharts-rectangle`, `recharts-cartesian-grid-*`), que são
 * estáveis e a única forma de inspecionar o desenho.
 */
import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/** Troca espaços não-quebráveis/finos do `Intl` por espaço comum. */
const normalizeSpaces = (value: string) => value.replace(/[\u00a0\u202f]/g, ' ');

/** VERDE80 da referência: `rgba(0,120,103,0.8)`, resolvido do token do DS. */
const GREEN_80 = 'rgba(0, 120, 103, 0.8)';

/** O mesmo verde escurecido em 20% — o hover da referência ESCURECE. */
const GREEN_80_HOVER = 'rgba(0, 96, 82, 0.8)';

describe('bloco h_bar_chart — estados', () => {
  it('mostra esqueleto enquanto os dados não chegam', () => {
    renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('avisa quando a consulta não devolveu linhas', () => {
    renderWithProviders(<Block props={{}} data={[]} state="success" />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('mostra a mensagem do erro no lugar do gráfico', () => {
    renderWithProviders(
      <Block props={{}} data={[]} state="error" error="Consulta expirou" />,
    );
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('bloco h_bar_chart — leitura sem ver', () => {
  it('anuncia o gráfico como imagem de dados', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByRole('img', { name: 'Barras Horizontais' })).toBeInTheDocument();
  });

  it('publica as categorias e os valores como tabela', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Centro' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Oeste' })).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Valor' }),
    ).toBeInTheDocument();
    // Categoria + valor: o gráfico tem UMA medida por categoria.
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
  });

  it('resume o conjunto em texto para quem não vê o desenho', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByText(/5 categorias\./)).toBeInTheDocument();
    expect(screen.getByText(/Centro: 1\.200/)).toBeInTheDocument();
  });
});

describe('bloco h_bar_chart — contrato comum de texto', () => {
  it('reduz o markdown do rótulo a texto puro antes de desenhar', () => {
    renderWithProviders(
      <Block props={{}} data={[{ x: '**Centro** de custo', y: 10 }]} state="success" />,
    );
    const table = screen.getByRole('table');
    expect(
      within(table).getByRole('rowheader', { name: 'Centro de custo' }),
    ).toBeInTheDocument();
  });

  it('resolve {{variáveis}} do rótulo com o escopo derivado dos dados', () => {
    renderWithProviders(
      <Block
        props={{}}
        data={[
          { x: 'Maior de {{contagem}}', y: 30 },
          { x: 'Norte', y: 12 },
        ]}
        state="success"
      />,
    );
    const table = screen.getByRole('table');
    expect(
      within(table).getByRole('rowheader', { name: 'Maior de 2' }),
    ).toBeInTheDocument();
  });
});

describe('bloco h_bar_chart — formato do valor', () => {
  it('usa contagem PT-BR por padrão (não inventa moeda)', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const table = screen.getByRole('table');
    expect(within(table).getByText('1.200')).toBeInTheDocument();
    expect(within(table).queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it('respeita o valueFormat declarado no bloco', () => {
    renderWithProviders(
      <Block
        props={{ valueFormat: 'percent' }}
        data={[{ x: 'Centro', y: 0.125 }]}
        state="success"
      />,
    );
    expect(screen.getByRole('cell', { name: '12,5%' })).toBeInTheDocument();
  });

  it('formata o insight de rodapé na MESMA unidade da barra', () => {
    const takeaway = [
      definition.deriveTakeaway?.(fixture, { valueFormat: 'compactBRL' }),
    ].flat();
    // `Intl` separa o símbolo com espaço FINO/NÃO-QUEBRÁVEL: normalize antes de
    // comparar, senão o teste falha por um byte invisível.
    expect(takeaway.map((line) => normalizeSpaces(String(line)))).toEqual([
      'Maior: Centro (R$ 1,20 mil)',
      'Menor: Oeste (R$ 520,00)',
    ]);
  });
});

describe('bloco h_bar_chart — cor', () => {
  /** Cores de preenchimento das barras, na ordem do SVG. */
  const fills = (container: HTMLElement) =>
    [...container.querySelectorAll('.recharts-rectangle')].map((node) =>
      node.getAttribute('fill'),
    );

  /** Renderiza e espera a barra existir (a entrada é animada). */
  async function plotWith(props: Record<string, unknown>) {
    const view = renderWithProviders(
      <Block props={props} data={fixture} state="success" />,
    );
    await waitFor(() =>
      expect(view.container.querySelector('.recharts-rectangle')).not.toBeNull(),
    );
    return view;
  }

  it('não deixa uma cor crua legada chegar ao desenho', () => {
    const { container } = renderWithProviders(
      <Block
        props={{ palette: 'single', accent: '#40E0D0' }}
        data={fixture}
        state="success"
      />,
    );
    expect(container.innerHTML).not.toContain('#40E0D0');
  });

  /**
   * REGRESSÃO da causa raiz: `accent` só valia com `palette: "single"`, então
   * quem escolhesse `multi` perdia a cor pedida sem aviso. Agora o pedido
   * explícito vence — é o que qualquer um deduz lendo o contrato.
   */
  it('aplica o accent mesmo com palette="multi" (o pedido explícito vence)', async () => {
    const { container } = await plotWith({ palette: 'multi', accent: 'chart-3' });
    // Cinco categorias, UMA cor: a que o autor pediu (ciano = chart-3).
    expect(new Set(fills(container))).toEqual(new Set(['#00B8D9']));
  });

  it('sem accent, "multi" cicla uma cor por categoria e "single" usa uma só', async () => {
    const { container: multi, unmount } = await plotWith({ palette: 'multi' });
    // Cinco categorias, cinco cores da paleta, na ordem do ciclo.
    expect(fills(multi)).toEqual(['#00A76F', '#FFAB00', '#00B8D9', '#FF5630', '#22C55E']);
    unmount();

    const { container: single } = await plotWith({ palette: 'single' });
    // Uma cor só — e é a cor PADRÃO do tipo (o VERDE80 da §8), não a cor 1
    // crua: sem pedido de `accent`, o bloco não troca o visual da referência.
    expect(new Set(fills(single))).toEqual(new Set([GREEN_80]));
  });
});

/* ========================================================================== *
 * 5. CONFORMIDADE VISUAL — `03-tipos-de-grafico.md` §8 (Barra horizontal)
 * ========================================================================== */

/*
 * O `ResponsiveContainer` do recharts só desenha depois de MEDIR o container.
 * Este arquivo trazia um `ResizeObserver` próprio (`vi.stubGlobal`) porque o
 * polyfill global era um stub silencioso; o polyfill (`src/test/setup.ts`)
 * agora MEDE, então o dublê local saiu. Enquanto a medida era local, todo
 * teste que não a copiasse — inclusive a auditoria de inércia — via o gráfico
 * como caixa vazia e acusava como "inerte" qualquer prop cujo efeito é dentro
 * do SVG (foi o caso de `palette` e `accent` deste bloco).
 */

describe('bloco h_bar_chart — conformidade visual (§8)', () => {
  /** Renderiza o bloco e espera o desenho existir (a entrada é animada). */
  async function plot(props: Record<string, unknown> = {}): Promise<HTMLElement> {
    const { container } = renderWithProviders(
      <Block props={props} data={fixture} state="success" />,
    );
    await waitFor(() =>
      expect(container.querySelector('.recharts-rectangle')).not.toBeNull(),
    );
    return container;
  }

  it('pinta a barra com o verde escuro a 80% e sem traço', async () => {
    const container = await plot();
    const bar = container.querySelector('.recharts-rectangle');
    expect(bar?.getAttribute('fill')).toBe(GREEN_80);
    expect(bar?.getAttribute('stroke-width')).toBe('0');
  });

  it('arredonda 2px só na PONTA da barra (direita), não nos 4 cantos', async () => {
    const container = await plot();
    const bar = container.querySelector('.recharts-rectangle');
    expect(bar?.getAttribute('radius')).toBe('0,2,2,0');
  });

  it('dá à barra 30% da faixa da categoria', async () => {
    const container = await plot();
    const bars = [...container.querySelectorAll('.recharts-rectangle')];
    const read = (el: Element, attr: string) => Number(el.getAttribute(attr));
    // A faixa de uma categoria é a distância entre duas barras vizinhas.
    const band = read(bars[1], 'y') - read(bars[0], 'y');
    expect(read(bars[0], 'height') / band).toBeCloseTo(0.3, 1);
  });

  it('desenha a grade tracejada só no eixo de VALOR (aqui, o X)', async () => {
    const container = await plot();
    expect(container.querySelector('.recharts-cartesian-grid-horizontal')).toBeNull();
    const line = container.querySelector('.recharts-cartesian-grid-vertical line');
    expect(line?.getAttribute('stroke-dasharray')).toBe('3 3');
  });

  it('escreve os rótulos de eixo em 12px, sem linha nem marcação', async () => {
    const container = await plot();
    const tick = container.querySelector('.recharts-cartesian-axis-tick-value');
    expect(tick?.getAttribute('font-size')).toBe('12');
    expect(container.querySelector('.recharts-cartesian-axis-line')).toBeNull();
    expect(container.querySelector('.recharts-cartesian-axis-tick-line')).toBeNull();
  });

  it('ESCURECE a barra sob o ponteiro (a maioria das libs clareia)', async () => {
    const container = await plot();
    const wrapper = container.querySelector('.recharts-wrapper');
    fireEvent.mouseMove(wrapper as Element, { clientX: 300, clientY: 40 });
    await waitFor(() =>
      expect(container.querySelector('.recharts-active-bar')).not.toBeNull(),
    );
    const active = container.querySelector('.recharts-active-bar .recharts-rectangle');
    expect(active?.getAttribute('fill')).toBe(GREEN_80_HOVER);
    // A ponta arredondada e a ausência de traço não mudam no hover.
    expect(active?.getAttribute('radius')).toBe('0,2,2,0');
    expect(active?.getAttribute('stroke-width')).toBe('0');
  });
});
