/**
 * Regressão de TAMANHO DO MARCADOR.
 *
 * O defeito que este arquivo tranca: `CHART_GEOMETRY.markerVisibleSize` (6) é
 * DIÂMETRO, e cada gráfico convertia por conta própria — `line-chart` e
 * `area-chart` passavam o token direto para o `r` (ponto de 12px), o
 * `scatter-chart` calculava a área como `π·d²` (quatro vezes a área, ponto de
 * 12px) e só o `spark-chart` dividia por 2. Lado a lado no `/catalog`, a linha
 * aparecia com ponto gordo ao lado de um mini-gráfico com ponto fino.
 *
 * A correção é uma leitura só (`chart-marker`), então o que interessa travar é
 * o RESULTADO: o mesmo diâmetro nos quatro tipos, venha ele de um `r` de SVG
 * ou de uma área de símbolo do d3.
 *
 * O que dá para ver em cada tipo:
 *   • linha e dispersão — o marcador é permanente; sai no SVG e é medido aqui;
 *   • área e mini-gráfico — o marcador só existe SOB O CURSOR (`activeDot`), e
 *     no jsdom não há como posicionar o ponteiro sobre o desenho de forma
 *     confiável (`getBoundingClientRect` devolve zeros). Deles trancamos o que
 *     realmente decide o tamanho: os props que o `chart-marker` produz — que
 *     são, literalmente, o objeto que os dois passam para `activeDot`.
 *
 * O mock do `ResponsiveContainer` é o mesmo de `bar-thickness.test.tsx`: no
 * jsdom o contêiner mede 0×0 e o recharts não desenha nada.
 */
import { cloneElement, isValidElement, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { CHART_GEOMETRY } from '../chart-theme';
import {
  chartMarkerArea,
  chartMarkerProps,
  chartSparkMarkerProps,
} from '../chart-marker';
import { useChartPalette } from '../use-chart-palette';

/** Caixa do desenho — larga o bastante para o recharts abrir a escala. */
const WIDTH = 640;
const HEIGHT = 320;

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) =>
      isValidElement(children)
        ? cloneElement(children as ReactElement<{ width: number; height: number }>, {
            width: WIDTH,
            height: HEIGHT,
          })
        : children,
  };
});

const { LineChart } = await import('../line-chart');
const { ScatterChart } = await import('../scatter-chart');
const { SparkChart } = await import('../spark-chart');

/** O DIÂMETRO da especificação — o número que todo tipo tem de entregar. */
const DIAMETER = CHART_GEOMETRY.markerVisibleSize;

const LABELS = ['Jan', 'Fev', 'Mar', 'Abr'];
const VALUES = [12, 18, 15, 24];
const POINTS = [
  { x: 12, y: 40, category: 'A' },
  { x: 28, y: 55, category: 'B' },
];

/**
 * Expõe o que o `chart-marker` calcula para o tema ativo. Mesmo padrão da
 * sonda de `scatter_chart/layout.test.tsx`: o teste nunca crava número de
 * desenho, lê o que o tema resolveu.
 */
function MarkerProbe() {
  const palette = useChartPalette();
  const dot = chartMarkerProps(palette, 'transparent');
  const spark = chartSparkMarkerProps(palette, 'transparent');
  return (
    <span
      data-testid="marker"
      data-radius={dot.r}
      data-stroke={dot.strokeWidth}
      data-area={chartMarkerArea(palette)}
      data-spark-radius={spark.r}
      data-spark-stroke={spark.strokeWidth}
    />
  );
}

/** Lê a sonda como números. */
function readProbe(container: HTMLElement) {
  const node = container.querySelector<HTMLElement>('[data-testid="marker"]')!;
  return {
    radius: Number(node.dataset.radius),
    stroke: Number(node.dataset.stroke),
    area: Number(node.dataset.area),
    sparkRadius: Number(node.dataset.sparkRadius),
    sparkStroke: Number(node.dataset.sparkStroke),
  };
}

describe('marcador — uma leitura só do token', () => {
  it('converte o DIÂMETRO do tema em raio, área e halo de forma coerente', () => {
    const { container } = renderWithProviders(<MarkerProbe />);
    const { radius, stroke, area, sparkRadius, sparkStroke } = readProbe(container);

    // O `r` do SVG é metade do token — era daqui que saía o ponto de 12px.
    expect(radius * 2).toBe(DIAMETER);
    // A área do símbolo do d3 tem de descrever ESSE MESMO ponto: `π·r²`. Com a
    // conta antiga (`π·d²`), este diâmetro daria 12.
    expect(2 * Math.sqrt(area / Math.PI)).toBeCloseTo(DIAMETER, 10);
    // O mini-gráfico é o mesmo ponto, só que sem halo (§2.3).
    expect(sparkRadius).toBe(radius);
    expect(sparkStroke).toBe(CHART_GEOMETRY.sparkMarkerStrokeWidth);
    // Halo proporcional: mesmo divisor do raio.
    expect(stroke).toBe(CHART_GEOMETRY.markerStrokeWidth / 2);
  });

  it('deixa o ponto LER como ponto, não como anel', () => {
    const { container } = renderWithProviders(<MarkerProbe />);
    const { radius, stroke } = readProbe(container);

    // Traço de SVG fica centrado no caminho: ele come `stroke/2` de miolo e
    // cresce `stroke/2` para fora. Com os 3px crus do token num ponto de r=3,
    // sobrava um miolo de 3px dentro de uma marca de 9px — um anel.
    const core = DIAMETER - stroke;
    const outer = DIAMETER + stroke;

    expect(stroke).toBeLessThan(radius);
    // O miolo colorido é a figura principal: maior que o halo que o cerca.
    expect(core).toBeGreaterThan(DIAMETER / 2);
    // E a marca não pode estourar meio token de tamanho por causa do contorno.
    expect(outer).toBeLessThanOrEqual(DIAMETER * 1.5);
  });
});

describe('marcador — o que aparece no desenho', () => {
  it('a LINHA desenha cada ponto com o raio e o halo do tema', async () => {
    const { container } = renderWithProviders(
      <>
        <MarkerProbe />
        <LineChart
          series={[{ label: 'Receita', data: VALUES }]}
          labels={LABELS}
          showLegend={false}
        />
      </>,
    );

    const { radius, stroke } = readProbe(container);
    // Os pontos só entram no SVG depois da animação de entrada (360ms).
    await waitFor(() => {
      expect(container.querySelectorAll('circle.recharts-dot')).toHaveLength(
        VALUES.length,
      );
    });

    for (const dot of container.querySelectorAll('circle.recharts-dot')) {
      expect(Number(dot.getAttribute('r'))).toBe(radius);
      expect(Number(dot.getAttribute('stroke-width'))).toBe(stroke);
    }
  });

  it('a DISPERSÃO desenha o MESMO ponto da linha', async () => {
    const { container } = renderWithProviders(
      <>
        <MarkerProbe />
        <ScatterChart data={POINTS} showLegend={false} />
      </>,
    );

    const { radius } = readProbe(container);
    // d3 escreve o círculo como `M<r>,0A<r>,<r>,…` — o raio está no path.
    await waitFor(() => {
      const symbols = [...container.querySelectorAll('.recharts-symbols')];
      expect(symbols).toHaveLength(POINTS.length);
      for (const symbol of symbols) {
        expect(symbol.getAttribute('d')).toContain(`A${radius},${radius},`);
      }
    });
  });
});

describe('espessura do traço — a hierarquia é PROPOSITAL', () => {
  it('mantém a linha com eixo mais grossa que o mini-gráfico', async () => {
    const withAxis = renderWithProviders(
      <LineChart
        series={[{ label: 'Receita', data: VALUES }]}
        labels={LABELS}
        showLegend={false}
      />,
    );
    const axisStroke = withAxis.container
      .querySelector('path.recharts-line-curve')
      ?.getAttribute('stroke-width');
    expect(Number(axisStroke)).toBe(CHART_GEOMETRY.lineWidth);
    withAxis.unmount();

    const spark = renderWithProviders(
      <SparkChart data={VALUES} type="line" label="Tendência" />,
    );
    const sparkStroke = spark.container
      .querySelector('path.recharts-line-curve')
      ?.getAttribute('stroke-width');
    expect(Number(sparkStroke)).toBe(CHART_GEOMETRY.sparkLineWidth);

    // 2,5 contra 2: o gráfico com eixo é o principal, o spark acompanha um
    // número. Igualar os dois é tão errado quanto o ponto de 12px.
    expect(CHART_GEOMETRY.sparkLineWidth).toBeLessThan(CHART_GEOMETRY.lineWidth);
  });
});
