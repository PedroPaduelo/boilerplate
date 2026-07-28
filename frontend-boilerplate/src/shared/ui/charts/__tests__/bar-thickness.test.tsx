/**
 * Regressão de ESPESSURA das barras.
 *
 * O defeito que este arquivo tranca: a referência mede a coluna em FRAÇÃO da
 * faixa (48/40/36%), e fração não tem teto. Num card de 330px isso dava uma
 * coluna de 21px — certo —, mas o MESMO gráfico esticado num painel de 1.500px
 * com cinco categorias dava **118px**: a coluna deixava de ser uma marca de
 * medida e virava um bloco de cor, brigando com o resto da interface.
 *
 * A correção é um teto em pixel (`geometry.barMaxWidth` / `hBarMaxWidth`),
 * aplicado pelo recharts via `maxBarSize`. Como o teto só aparece quando o
 * contêiner é LARGO, o teste precisa de um contêiner largo — e no jsdom o
 * `ResponsiveContainer` mede zero. Daí o mock: ele repassa uma largura fixa ao
 * gráfico, que é exatamente o que o navegador faria.
 *
 * A espessura é lida dos atributos `width`/`height` do `<path>` da barra (o
 * recharts os escreve no SVG junto com o `d`), e não do `d`, que é um caminho
 * com arcos e não se mede por regex.
 *
 * O `waitFor` não é folclore: a entrada dura 360ms e, no primeiro quadro, a
 * barra tem altura ~0 e o recharts nem desenha o caminho.
 */
import { cloneElement, isValidElement, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { CHART_GEOMETRY } from '../chart-theme';

/** Largura de um painel de dashboard — o cenário em que a coluna engordava. */
const WIDE = 1500;

/** Altura da plotagem (o padrão do catálogo). */
const TALL = 320;

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) =>
      isValidElement(children)
        ? cloneElement(children as ReactElement<{ width: number; height: number }>, {
            width: WIDE,
            height: TALL,
          })
        : children,
  };
});

const { BarChart } = await import('../bar-chart');
const { HBarChart } = await import('../h-bar-chart');

const BARS = '.recharts-bar-rectangle path';

/** Barras já desenhadas (depois da animação de entrada). */
async function drawnBars(container: HTMLElement, expected: number) {
  await waitFor(() => {
    expect(container.querySelectorAll(BARS)).toHaveLength(expected);
  });
  return [...container.querySelectorAll(BARS)];
}

/** Valor numérico de um atributo geométrico do retângulo. */
function attr(node: Element, name: 'x' | 'y' | 'width' | 'height'): number {
  return Number(node.getAttribute(name));
}

const LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'];
const VALUES = [120, 90, 150, 80, 110];
const POINTS = LABELS.map((label, index) => ({ label, value: VALUES[index] }));

describe('espessura da coluna', () => {
  it('para de engordar no teto quando o contêiner é largo', async () => {
    const { container } = renderWithProviders(
      <BarChart
        series={[{ label: 'Receita', data: VALUES }]}
        labels={LABELS}
        showLegend={false}
      />,
    );

    const bars = await drawnBars(container, LABELS.length);

    for (const bar of bars) {
      // Sem o teto, esta mesma configuração desenhava 118px.
      expect(attr(bar, 'width')).toBeLessThanOrEqual(CHART_GEOMETRY.barMaxWidth);
    }
    expect(attr(bars[0], 'width')).toBe(CHART_GEOMETRY.barMaxWidth);
  });

  it('mantém a proporção da referência quando a faixa é menor que o teto', async () => {
    // 40 categorias em 1.500px: a faixa dá ~36px e 40% dela fica MUITO abaixo do
    // teto — aqui quem manda tem de continuar sendo a fração da referência.
    const many = Array.from({ length: 40 }, (_, index) => `S${index}`);
    const { container } = renderWithProviders(
      <BarChart
        series={[{ label: 'Volume', data: many.map((_, index) => index + 1) }]}
        labels={many}
        showLegend={false}
      />,
    );

    const bars = await drawnBars(container, many.length);
    const widths = bars.map((bar) => attr(bar, 'width'));

    expect(Math.max(...widths)).toBeLessThan(CHART_GEOMETRY.barMaxWidth);
    expect(Math.min(...widths)).toBeGreaterThan(0);
  });

  it('mantém as colunas de uma categoria mais próximas entre si que da vizinha', async () => {
    const { container } = renderWithProviders(
      <BarChart
        series={[
          { label: 'Receita', data: VALUES },
          { label: 'Despesa', data: [100, 70, 120, 60, 95] },
        ]}
        labels={LABELS}
        showLegend={false}
      />,
    );

    const bars = await drawnBars(container, LABELS.length * 2);
    const lefts = bars.map((bar) => attr(bar, 'x')).sort((a, b) => a - b);
    const distances = lefts.slice(1).map((left, index) => left - lefts[index]);

    // Pares consecutivos alternam "dentro do grupo" e "para o próximo grupo".
    const insideGroup = distances.filter((_, index) => index % 2 === 0);
    const betweenGroups = distances.filter((_, index) => index % 2 === 1);

    // O teto faz o recharts recentrar cada coluna na sua vaga; a leitura "lado
    // a lado" só sobrevive se o grupo continuar mais junto do que separado.
    expect(Math.max(...insideGroup)).toBeLessThan(Math.min(...betweenGroups));
  });
});

describe('espessura da barra horizontal', () => {
  it('para de engordar no teto quando sobra altura', async () => {
    // Três linhas em 320px de altura: a faixa dá ~100px e 30% dela passaria do
    // teto — é o ranking curto que virava tarja.
    const { container } = renderWithProviders(
      <HBarChart data={POINTS.slice(0, 3)} label="Ranking" />,
    );

    const bars = await drawnBars(container, 3);

    for (const bar of bars) {
      expect(attr(bar, 'height')).toBeLessThanOrEqual(CHART_GEOMETRY.hBarMaxWidth);
    }
    expect(attr(bars[0], 'height')).toBe(CHART_GEOMETRY.hBarMaxWidth);
  });
});
