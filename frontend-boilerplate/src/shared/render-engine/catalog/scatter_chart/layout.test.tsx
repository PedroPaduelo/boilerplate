/**
 * Conformidade VISUAL do §15 (Dispersão) — as medidas que só existem dentro do
 * SVG e que `component.test.tsx` (comportamento/a11y) não alcança.
 *
 * Por que este arquivo mocka o `ResponsiveContainer`: no jsdom o contêiner mede
 * 0×0, então o recharts não desenha NADA — nem eixo, nem ponto. Trocando só o
 * contêiner por um tamanho fixo, o gráfico real é renderizado e dá para afirmar
 * sobre o desenho. O resto do recharts é o de verdade (`importActual`).
 *
 * O que este arquivo trava (`03-tipos-de-grafico.md` §15):
 *  - marcador de RAIO 6px;
 *  - eixo X com 8 divisões (9 marcas) e valores com 1 casa decimal;
 *  - grade só HORIZONTAL, tracejada 3;
 *  - eixos sem linha e sem marcações;
 *  - cor por categoria vinda da paleta base, NA ORDEM (comparada com o que o
 *    `useChartPalette` devolve — nenhum hexadecimal escrito no teste).
 */
import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { cloneElement } from 'react';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { useChartPalette } from '@/shared/ui';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) =>
      cloneElement(children as ReactElement<{ width?: number; height?: number }>, {
        width: 640,
        height: 350,
      }),
  };
});

const { definition } = await import('./component');
const Block = definition.Component;

/** Duas categorias → duas cores da paleta base, na ordem. */
const DATA = [
  { x: 12, y: 40, series: 'Zona A' },
  { x: 28, y: 55, series: 'Zona B' },
];

/** Expõe as cores que o tema resolve, para o teste não cravar hexadecimal. */
function PaletteProbe() {
  const palette = useChartPalette();
  return (
    <span
      data-testid="palette"
      data-first={palette.colorAt(0)}
      data-second={palette.colorAt(1)}
      data-marker={palette.geometry.markerVisibleSize}
    />
  );
}

/** Renderiza o bloco com o desenho de verdade e espera a animação terminar. */
async function renderChart() {
  const view = renderWithProviders(
    <>
      <PaletteProbe />
      <Block props={{}} data={DATA} state="success" />
    </>,
  );
  await waitFor(() => {
    expect(view.container.querySelectorAll('.recharts-symbols')).toHaveLength(2);
  });
  return view;
}

describe('scatter_chart — conformidade visual §15', () => {
  it('desenha marcadores com o raio do tema (6px)', async () => {
    const { container, getByTestId } = await renderChart();
    const radius = getByTestId('palette').dataset.marker;
    // A animação de entrada cresce o ponto até o tamanho final — esperamos por
    // ele, e é justamente esse valor que a referência fixa em 6px.
    await waitFor(() => {
      const symbols = [...container.querySelectorAll('.recharts-symbols')];
      for (const symbol of symbols) {
        // d3 escreve o círculo como `M<r>,0A<r>,<r>,…` — o raio está no path.
        expect(symbol.getAttribute('d')).toContain(`A${radius},${radius},`);
      }
    });
  });

  it('pinta as categorias com a paleta base, na ordem', async () => {
    const { container, getByTestId } = await renderChart();
    const { first, second } = getByTestId('palette').dataset;
    const fills = [...container.querySelectorAll('.recharts-symbols')].map((node) =>
      node.getAttribute('fill'),
    );
    expect(fills).toEqual([first, second]);
  });

  it('divide o eixo X em 8 e escreve os valores com 1 casa decimal', async () => {
    const { container } = await renderChart();
    const ticks = [
      ...container.querySelectorAll(
        '.recharts-xAxis .recharts-cartesian-axis-tick-value',
      ),
    ].map((node) => node.textContent ?? '');
    // 8 divisões = 9 marcas (o recharts conta os limites).
    expect(ticks).toHaveLength(9);
    for (const tick of ticks) expect(tick).toMatch(/^-?[\d.]+,\d$/);
  });

  it('desenha a grade só na horizontal, tracejada', async () => {
    const { container } = await renderChart();
    const lines = [...container.querySelectorAll('.recharts-cartesian-grid line')];
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line.getAttribute('y1')).toBe(line.getAttribute('y2'));
      expect(line.getAttribute('stroke-dasharray')).toBe('3 3');
    }
  });

  it('não desenha linha nem marcação nos eixos', async () => {
    const { container } = await renderChart();
    expect(container.querySelector('.recharts-cartesian-axis-line')).toBeNull();
    expect(container.querySelector('.recharts-cartesian-axis-tick-line')).toBeNull();
  });
});
