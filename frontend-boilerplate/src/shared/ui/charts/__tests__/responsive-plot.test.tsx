/**
 * RESPONSIVIDADE — o desenho acompanha a largura do contêiner?
 *
 * Todo gráfico com eixo do catálogo entrega a plotagem ao `ResponsiveContainer`
 * do recharts, que MEDE o contêiner com `ResizeObserver` e só então desenha.
 * São dois contratos distintos, e os dois já falharam em produção:
 *
 *  1. o desenho tem de EXISTIR na primeira medida (senão o gráfico aparece
 *     vazio até alguém redimensionar a janela);
 *  2. o desenho tem de SE REFAZER quando a medida muda (senão o card fica com
 *     um SVG de outro tamanho — cortado ou sobrando — depois de abrir um painel
 *     lateral, mudar de coluna na grade ou girar o tablet).
 *
 * O jsdom não tem motor de layout: quem "mede" aqui é o polyfill de
 * `ResizeObserver` (`src/test/setup.ts`). Este arquivo instala um observador
 * CONTROLÁVEL — ele guarda os callbacks e reemite a medida sob comando — porque
 * a segunda pergunta exige mudar a largura DEPOIS do primeiro desenho, que é
 * exatamente o que um `ResizeObserver` real faz ao redimensionar.
 *
 * Cobre os seis tipos com eixo do catálogo de uma vez: o `ResponsiveContainer`
 * é o mesmo em todos, então um teste por tipo seria a mesma prova seis vezes —
 * mas a lista é percorrida para que um tipo novo entre aqui em vez de nascer
 * sem cobertura.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { AreaChart } from '../area-chart';
import { BarChart } from '../bar-chart';
import { HBarChart } from '../h-bar-chart';
import { LineChart } from '../line-chart';
import { ScatterChart } from '../scatter-chart';
import { SparkChart } from '../spark-chart';

/** Série de duas categorias — o mínimo para haver eixo e escala. */
const SERIES = [{ label: 'Receita', data: [10, 20, 15] }];
const LABELS = ['Jan', 'Fev', 'Mar'];
const POINTS = [
  { label: 'Centro', value: 30 },
  { label: 'Norte', value: 20 },
];

/**
 * Observador controlável: registra os alvos e reemite a medida quando o teste
 * mandar. É o mínimo para simular um redimensionamento — o polyfill global
 * mede uma vez, na montagem, e não teria como mudar de ideia depois.
 */
class ControlledResizeObserver {
  static instances: ControlledResizeObserver[] = [];

  private readonly callback: ResizeObserverCallback;
  private readonly targets = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ControlledResizeObserver.instances.push(this);
  }

  observe(target: Element) {
    this.targets.add(target);
    this.emit(ControlledResizeObserver.width);
  }

  unobserve(target: Element) {
    this.targets.delete(target);
  }

  disconnect() {
    this.targets.clear();
  }

  /** Reemite a medida atual para todos os alvos observados. */
  emit(width: number) {
    for (const target of this.targets) {
      this.callback(
        [
          {
            target,
            contentRect: { width, height: 320, top: 0, left: 0 },
          } as unknown as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      );
    }
  }

  /** Largura entregue na próxima observação. */
  static width = 800;

  /**
   * Simula o redimensionamento do contêiner de todos os gráficos montados.
   *
   * Dentro de `act()` porque um `ResizeObserver` real dispara FORA do ciclo do
   * React: sem isso a mudança de estado do `ResponsiveContainer` fica na fila e
   * o `expect` seguinte leria o SVG antigo — falso negativo.
   */
  static resizeTo(width: number) {
    ControlledResizeObserver.width = width;
    act(() => {
      for (const instance of ControlledResizeObserver.instances) instance.emit(width);
    });
  }
}

/** Os tipos com eixo do catálogo, cada um montado com o dado mínimo. */
const CHARTS = [
  { name: 'AreaChart', render: () => <AreaChart series={SERIES} labels={LABELS} /> },
  { name: 'BarChart', render: () => <BarChart series={SERIES} labels={LABELS} /> },
  { name: 'HBarChart', render: () => <HBarChart data={POINTS} /> },
  { name: 'LineChart', render: () => <LineChart series={SERIES} labels={LABELS} /> },
  {
    name: 'ScatterChart',
    render: () => (
      <ScatterChart
        data={[
          { x: 1, y: 2, category: 'A' },
          { x: 3, y: 4, category: 'A' },
        ]}
      />
    ),
  },
  {
    name: 'SparkChart',
    render: () => <SparkChart data={[3, 6, 4, 9]} label="Tendência" />,
  },
] as const;

/** Largura do SVG desenhado (o recharts a escreve como atributo). */
function plotWidth(container: HTMLElement): number {
  return Number(container.querySelector('.recharts-surface')?.getAttribute('width'));
}

let originalObserver: typeof ResizeObserver;

beforeEach(() => {
  originalObserver = globalThis.ResizeObserver;
  ControlledResizeObserver.instances = [];
  ControlledResizeObserver.width = 800;
  globalThis.ResizeObserver =
    ControlledResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  globalThis.ResizeObserver = originalObserver;
});

describe('gráficos do catálogo — responsividade do contêiner', () => {
  it.each(CHARTS)('$name desenha já na primeira medida', ({ render }) => {
    const { container } = renderWithProviders(render());
    expect(plotWidth(container)).toBe(800);
  });

  it.each(CHARTS)('$name se refaz quando o contêiner muda de largura', ({ render }) => {
    const { container } = renderWithProviders(render());
    expect(plotWidth(container)).toBe(800);

    // Metade da largura — o caso de abrir um painel lateral sobre o painel.
    ControlledResizeObserver.resizeTo(400);
    expect(plotWidth(container)).toBe(400);

    // E de volta: o desenho não pode "lembrar" da largura antiga.
    ControlledResizeObserver.resizeTo(1200);
    expect(plotWidth(container)).toBe(1200);
  });

  it('mantém a altura do tipo enquanto a largura muda', () => {
    const { container } = renderWithProviders(
      <AreaChart series={SERIES} labels={LABELS} />,
    );
    const height = container.querySelector('.recharts-surface')?.getAttribute('height');

    ControlledResizeObserver.resizeTo(360);

    // A altura é geometria do TIPO (320px, `CHART_HEIGHT.default`), não do
    // contêiner: encolher a largura não pode achatar o gráfico.
    expect(container.querySelector('.recharts-surface')?.getAttribute('height')).toBe(
      height,
    );
  });
});
