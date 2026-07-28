/**
 * Regressão do bloco `area_chart` depois da repaginação visual (lote SUB-02).
 *
 * O que este arquivo trava:
 * 1. OS TRÊS ESTADOS — carregando, sem dados e erro. Área vazia em silêncio era
 *    o defeito clássico do bloco antigo.
 * 2. LEITURA SEM VER — os números do eixo vivem dentro do SVG; o bloco precisa
 *    publicá-los como tabela para leitor de tela.
 * 3. O LAYOUT DA REFERÊNCIA (`03-tipos-de-grafico.md` §2 — Área): gradiente
 *    vertical 0.4 → 0 com paradas 0 e 100, cores 1ª/2ª do ciclo, linha 2,5px
 *    curva e sem pontos, grade só horizontal tracejada 3, eixos sem linha nem
 *    marcações, altura 320px. É o que faz "parecer igual" — e o que uma
 *    refatoração distraída desfaz primeiro.
 * 4. AS PROPS PÚBLICAS — `fill`, `type`, `showLegend`, `showGridLines`,
 *    `palette`, `accent` e `valueFormat` continuam com efeito.
 *
 * Consultas por papel acessível — nunca por classe do StyleX (são hashes novos
 * a cada build). As poucas classes usadas aqui são do RECHARTS (`recharts-*`),
 * que são estáveis e a única forma de inspecionar o desenho dentro do SVG.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/** Cores 1ª e 2ª do ciclo da referência (`01-fundamentos.md` §2). */
const CYCLE_1 = '#00A76F';
const CYCLE_2 = '#FFAB00';

/** Duas séries com participação redonda — facilita afirmar o modo percentual. */
const HALVES = [
  { x: 'Jan', y: 75, series: 'Receita' },
  { x: 'Jan', y: 25, series: 'Despesa' },
];

/**
 * O `ResponsiveContainer` do recharts só desenha depois de MEDIR o container, e
 * o polyfill global de `ResizeObserver` (`src/test/setup.ts`) nunca chama o
 * callback — no jsdom o gráfico ficaria vazio e nenhuma regra de layout seria
 * verificável. Este observador entrega uma medida fixa assim que é acionado.
 */
beforeAll(() => {
  class MeasuringResizeObserver {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element) {
      this.callback(
        [
          {
            target,
            contentRect: { width: 640, height: 320, top: 0, left: 0 },
          } as unknown as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = MeasuringResizeObserver as unknown as typeof ResizeObserver;
});

/** Atalho: renderiza o bloco com a fixture e devolve o container. */
function renderBlock(props: Record<string, unknown> = {}, data = fixture) {
  return renderWithProviders(<Block props={props} data={data} state="success" />);
}

describe('bloco area_chart — estados', () => {
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

  it('mostra o erro no lugar do gráfico, com o detalhe da falha', () => {
    renderWithProviders(
      <Block props={{}} data={[]} state="error" error="Consulta expirou" />,
    );
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
  });
});

describe('bloco area_chart — leitura sem ver', () => {
  it('anuncia o gráfico como imagem de dados com equivalente textual', () => {
    renderBlock();
    expect(screen.getByRole('img', { name: /área/i })).toBeInTheDocument();
    expect(screen.getByText(/2 série\(s\): Receita, Despesa/)).toBeInTheDocument();
  });

  it('publica os períodos e os valores como tabela', () => {
    renderBlock();
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: '2026-01' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: '2026-06' })).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Receita' }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Despesa' }),
    ).toBeInTheDocument();
  });

  it('lista as séries na legenda, na ordem em que foram desenhadas', () => {
    renderBlock();
    // A legenda é a única lista do bloco; a tabela equivalente repete os mesmos
    // rótulos como cabeçalho de coluna, então a consulta precisa ser por papel.
    const items = screen.getAllByRole('listitem').map((node) => node.textContent);
    expect(items).toEqual(['Receita', 'Despesa']);
  });
});

describe('bloco area_chart — layout da referência (§2 Área)', () => {
  it('preenche com gradiente VERTICAL de 0.4 no topo a 0 na base, paradas 0 e 100', () => {
    const { container } = renderBlock();
    const gradients = container.querySelectorAll('linearGradient');
    // Um gradiente por série: a cor da série entra nos `stop`s.
    expect(gradients).toHaveLength(2);

    for (const gradient of gradients) {
      // Vertical: mesma coordenada em x, do topo (y1=0) à base (y2=1).
      expect(gradient.getAttribute('x1')).toBe('0');
      expect(gradient.getAttribute('x2')).toBe('0');
      expect(gradient.getAttribute('y1')).toBe('0');
      expect(gradient.getAttribute('y2')).toBe('1');

      const stops = gradient.querySelectorAll('stop');
      expect(stops).toHaveLength(2);
      expect(stops[0].getAttribute('offset')).toBe('0%');
      expect(stops[0].getAttribute('stop-opacity')).toBe('0.4');
      expect(stops[1].getAttribute('offset')).toBe('100%');
      expect(stops[1].getAttribute('stop-opacity')).toBe('0');
    }
  });

  it('pega as cores na ORDEM do ciclo: 1ª verde do produto, 2ª âmbar', () => {
    const { container } = renderBlock();
    const gradients = container.querySelectorAll('linearGradient');
    expect(gradients[0].querySelector('stop')?.getAttribute('stop-color')).toBe(CYCLE_1);
    expect(gradients[1].querySelector('stop')?.getAttribute('stop-color')).toBe(CYCLE_2);
  });

  it('liga cada área ao gradiente da PRÓPRIA série', () => {
    const { container } = renderBlock();
    const ids = [...container.querySelectorAll('linearGradient')].map((node) => node.id);
    const fills = [...container.querySelectorAll('path.recharts-area-area')].map((node) =>
      node.getAttribute('fill'),
    );
    expect(fills).toEqual(ids.map((id) => `url(#${id})`));
  });

  it('desenha a linha de topo com 2,5px, curva suave e sem pontos', () => {
    const { container } = renderBlock();
    const curve = container.querySelector<SVGPathElement>('path.recharts-area-curve');
    expect(curve?.getAttribute('stroke-width')).toBe('2.5');
    expect(curve?.getAttribute('stroke')).toBe(CYCLE_1);
    // Ponta arredondada (§6) e curva suave — `C` é o comando de Bézier que só
    // aparece quando a curva é `monotone`; um traçado reto teria apenas `L`.
    expect(curve?.getAttribute('stroke-linecap')).toBe('round');
    expect(curve?.getAttribute('d')).toContain('C');
    // Marcadores invisíveis: nenhum ponto desenhado sobre a linha.
    expect(container.querySelectorAll('svg circle')).toHaveLength(0);
  });

  it('mantém a grade só horizontal e tracejada 3', () => {
    const { container } = renderBlock();
    const horizontal = container.querySelector('.recharts-cartesian-grid-horizontal');
    expect(horizontal).not.toBeNull();
    expect(container.querySelector('.recharts-cartesian-grid-vertical')).toBeNull();
    for (const line of horizontal!.querySelectorAll('line')) {
      expect(line.getAttribute('stroke-dasharray')).toBe('3 3');
    }
    // 5 divisões no eixo Y = 6 guias (o recharts conta os limites).
    expect(horizontal!.querySelectorAll('line')).toHaveLength(6);
  });

  it('deixa os eixos sem linha e sem marcações, com texto de 12px', () => {
    const { container } = renderBlock();
    expect(container.querySelector('.recharts-cartesian-axis-line')).toBeNull();
    expect(container.querySelector('.recharts-cartesian-axis-tick-line')).toBeNull();

    const tick = container.querySelector('.recharts-cartesian-axis-tick-value');
    expect(tick?.getAttribute('font-size')).toBe('12');
    expect(tick?.getAttribute('font-weight')).toBe('400');
    // Cor do texto de eixo da referência (`#919EAB` = texto desabilitado).
    expect(tick?.getAttribute('fill')).toBe('#919EAB');
  });

  it('usa a altura padrão do catálogo (320px)', () => {
    renderBlock();
    expect(screen.getByRole('img', { name: /área/i })).toHaveStyle({ height: '320px' });
  });
});

describe('bloco area_chart — parâmetros continuam funcionando', () => {
  it('fill="solid" troca o gradiente por cor chapada translúcida', () => {
    const { container } = renderBlock({ fill: 'solid' });
    expect(container.querySelectorAll('linearGradient')).toHaveLength(0);
    const area = container.querySelector('path.recharts-area-area');
    expect(area?.getAttribute('fill')).toBe(CYCLE_1);
    expect(area?.getAttribute('fill-opacity')).toBe('0.4');
  });

  it('fill="none" deixa só a linha de topo', () => {
    const { container } = renderBlock({ fill: 'none' });
    expect(container.querySelectorAll('linearGradient')).toHaveLength(0);
    expect(
      container.querySelector('path.recharts-area-area')?.getAttribute('fill-opacity'),
    ).toBe('0');
    // A linha continua lá, com a espessura da referência.
    expect(
      container.querySelector('path.recharts-area-curve')?.getAttribute('stroke-width'),
    ).toBe('2.5');
  });

  it('showGridLines=false remove a grade', () => {
    const { container } = renderBlock({ showGridLines: false });
    expect(container.querySelector('.recharts-cartesian-grid')).toBeNull();
  });

  it('showLegend=false esconde a legenda, e o desenho continua', () => {
    renderBlock({ showLegend: false });
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByRole('img', { name: /área/i })).toBeInTheDocument();
  });

  it('type="percent" normaliza os valores em participação', () => {
    renderWithProviders(
      <Block props={{ type: 'percent' }} data={HALVES} state="success" />,
    );
    const table = screen.getByRole('table');
    expect(within(table).getByText('75%')).toBeInTheDocument();
    expect(within(table).getByText('25%')).toBeInTheDocument();
  });

  it('sem valueFormat o valor é NÚMERO; moeda continua sendo escolha explícita', () => {
    const { unmount } = renderBlock();
    expect(screen.getByRole('table').textContent).not.toContain('R$');
    unmount();

    renderBlock({ valueFormat: 'BRL' });
    expect(within(screen.getByRole('table')).getByText('R$ 120,00')).toBeInTheDocument();
  });
});

describe('bloco area_chart — cor', () => {
  it('resolve o acento antigo para um token de dado do design system', () => {
    const { container } = renderBlock({ palette: 'single', accent: 'chart-3' });
    // A legenda é a única marca de cor fora do SVG — e usa `var(--token)`.
    expect(container.innerHTML).toContain('--ds-color-info-main');
    // Dentro do SVG o mesmo token entra RESOLVIDO (atributo não aceita `var()`).
    expect(
      container.querySelector('linearGradient stop')?.getAttribute('stop-color'),
    ).toBe('#00B8D9');
  });

  it('não deixa uma cor crua legada chegar ao desenho', () => {
    const { container } = renderBlock({ palette: 'single', accent: '#40E0D0' });
    expect(container.innerHTML).not.toContain('#40E0D0');
    // Sem cor reconhecível, o gráfico cai na paleta — que é sempre do tema.
    expect(
      container.querySelector('linearGradient stop')?.getAttribute('stop-color'),
    ).toBe(CYCLE_1);
  });
});
