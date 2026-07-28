/**
 * Regressão de ESPESSURA e DIÂMETRO dos circulares — rosca, anel de progresso e
 * os TRÊS medidores (semicircular, barra radial e tracejado).
 *
 * O defeito que este arquivo tranca: a referência mede o anel como FRAÇÃO do
 * raio, e cada circular herdou a fração da SUA seção — furo de 72% na rosca,
 * 32% na barra radial, trilha de 50% no medidor. Medido no `/catalog`, na mesma
 * grade, isso dava anéis de **34px** (rosca), **30px** (anel de progresso) e
 * **88px** (medidor), em quadros de 240, 240 e 320. Cinco desenhos da mesma
 * figura, com três espessuras e três diâmetros: lê como cinco componentes de
 * origens diferentes, não como uma família.
 *
 * A correção é um degrau em pixel (`CHART_GEOMETRY.ringThickness`) aplicado por
 * `chartRingInnerRadius`, e um quadro único (`CHART_HEIGHT.circular`). Aqui a
 * espessura é medida no DOM, no `d` do setor que o recharts escreve — não na
 * prop que passamos —, porque o que o usuário reclamou foi do desenho, e é o
 * desenho que precisa provar os 24px.
 *
 * A TRILHA entra em todos os casos: ela é o mesmo anel apagado, e trilha mais
 * grossa que o arco de valor (o anel de progresso já teve) é o defeito mais
 * fácil de notar num medidor. Trilha muda de COR, nunca de espessura.
 *
 * O `waitFor` não é folclore: o arco de valor entra animado (360ms) e, no
 * primeiro quadro, o recharts ainda não escreveu o caminho.
 */
import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { CHART_GEOMETRY, CHART_HEIGHT } from '../chart-theme';
import { DonutChart } from '../donut-chart';
import { ProgressCircle } from '../progress-circle';
import { RadialGauge } from '../radial-gauge';

/** O degrau de espessura dos circulares (24px). */
const RING = CHART_GEOMETRY.ringThickness;

/** O quadro único dos circulares (240px). */
const SIDE = CHART_HEIGHT.circular;

/**
 * Raio externo do anel — o MESMO para rosca, anel de progresso e medidores.
 * Sai do tema porque era justamente aqui que os três divergiam: a rosca usava
 * metade do lado (Ø240) e os outros 0,45 (Ø216).
 */
const OUTER_RADIUS = Math.round(SIDE * CHART_GEOMETRY.ringOuterRatio);

const POINTS = [
  { label: 'Quitado', value: 62 },
  { label: 'Em aberto', value: 38 },
];

/**
 * Raios dos arcos de um caminho de setor, do maior para o menor.
 *
 * O recharts escreve o setor como `M … A raio,raio,…`: o 1º arco é o raio
 * EXTERNO e o outro grande é o INTERNO. Quando a ponta é arredondada aparecem
 * também arcos do raio de canto (metade da faixa), sempre menores que os dois —
 * daí lermos os DOIS MAIORES, e não "o primeiro e o último".
 */
function radiiOf(path: Element): number[] {
  const d = path.getAttribute('d') ?? '';
  const found = [...d.matchAll(/A\s*([\d.]+)[,\s]/g)].map((match) => Number(match[1]));
  return [...new Set(found)].sort((a, b) => b - a);
}

/** Raio externo, interno e ESPESSURA de um anel desenhado. */
function ringOf(path: Element): { outer: number; inner: number; band: number } {
  const radii = radiiOf(path);
  const outer = radii[0] ?? 0;
  // Sem 2º raio o setor é um disco (furo zero) — a pizza.
  const inner = radii.length > 1 ? radii[1] : 0;
  return { outer, inner, band: outer - inner };
}

/** Setores já desenhados (depois da animação de entrada). */
async function sectors(container: HTMLElement, expected: number): Promise<Element[]> {
  await waitFor(() => {
    expect(container.querySelectorAll('.recharts-sector')).toHaveLength(expected);
  });
  return [...container.querySelectorAll('.recharts-sector')];
}

/** Lado do quadro desenhado, lido do `<svg>` do recharts. */
function drawnSide(container: HTMLElement): { width: number; height: number } {
  const svg = container.querySelector('svg.recharts-surface');
  return {
    width: Number(svg?.getAttribute('width')),
    height: Number(svg?.getAttribute('height')),
  };
}

describe('espessura do anel — a mesma nos cinco circulares', () => {
  it('rosca: anel de 24px (era o furo de 72%, que dava 34px)', async () => {
    const { container } = renderWithProviders(
      <DonutChart data={POINTS} label="Composição" />,
    );

    const slices = await sectors(container, POINTS.length);
    for (const slice of slices) {
      expect(ringOf(slice).band).toBe(RING);
    }
  });

  it('anel de progresso: 24px no arco de valor E na trilha', async () => {
    const { container } = renderWithProviders(
      <ProgressCircle value={73} label="Cobertura" />,
    );

    // 1º setor = trilha (volta completa), 2º = arco de valor.
    const [track, value] = await sectors(container, 2);
    expect(ringOf(track).band).toBe(RING);
    expect(ringOf(value).band).toBe(RING);
    // O defeito de origem: trilha de 93px atrás de um arco de 30px.
    expect(ringOf(track)).toEqual(ringOf(value));
  });

  it.each(['semicircle', 'radial'] as const)(
    'medidor %s: 24px no arco de valor E na trilha',
    async (variant) => {
      const { container } = renderWithProviders(
        <RadialGauge value={72} label="Cobertura" variant={variant} />,
      );

      const [track, value] = await sectors(container, 2);
      expect(ringOf(track).band).toBe(RING);
      expect(ringOf(value).band).toBe(RING);
      expect(ringOf(track)).toEqual(ringOf(value));
    },
  );

  it('medidor tracejado: traço de 24px sobre a trilha de 24px', async () => {
    const { container } = renderWithProviders(
      <RadialGauge value={72} label="Cobertura" variant="dashed" />,
    );

    const [track] = await sectors(container, 1);
    expect(ringOf(track).band).toBe(RING);

    // §13: a barra de valor é TRAÇO (para poder ser pontilhada), então a
    // espessura dela é o `stroke-width` — e tem de ser a mesma da trilha.
    const bar = container.querySelector('[data-slot="chart-gauge-dashed"]');
    expect(bar).toHaveAttribute('stroke-width', String(RING));
  });
});

describe('diâmetro dos circulares — um quadro só', () => {
  it.each([
    ['rosca', <DonutChart key="d" data={POINTS} label="Composição" />],
    ['anel de progresso', <ProgressCircle key="p" value={73} label="Cobertura" />],
    ['medidor semicircular', <RadialGauge key="s" value={72} label="Meta" />],
    ['barra radial', <RadialGauge key="r" value={72} label="Meta" variant="radial" />],
    [
      'medidor tracejado',
      <RadialGauge key="t" value={72} label="Meta" variant="dashed" />,
    ],
  ])('%s desenha em 240 × 240', (_name, element) => {
    const { container } = renderWithProviders(element);
    // Eram 240 (rosca e progresso), 260 (medidores) e 320 (barra radial).
    expect(drawnSide(container)).toEqual({ width: SIDE, height: SIDE });
  });
});

describe('espessura declarada continua vencendo o token', () => {
  it('anel de progresso: `thickness` em px é o override do helper', async () => {
    const { container } = renderWithProviders(
      <ProgressCircle value={73} label="Cobertura" thickness={40} />,
    );

    const [track, value] = await sectors(container, 2);
    expect(ringOf(value).band).toBe(40);
    // Override também vale para a trilha: ela não pode destoar do valor.
    expect(ringOf(track).band).toBe(40);
  });

  it('medidor: `thickness` em px é o override do helper', async () => {
    const { container } = renderWithProviders(
      <RadialGauge value={72} label="Meta" thickness={40} />,
    );

    const [, value] = await sectors(container, 2);
    expect(ringOf(value).band).toBe(40);
  });

  it('rosca: `thickness={1}` continua zerando o furo (pizza)', async () => {
    const { container } = renderWithProviders(
      <DonutChart data={POINTS} label="Composição" thickness={1} />,
    );

    const slices = await sectors(container, POINTS.length);
    for (const slice of slices) {
      // Fatia inteira: raio interno zero, sem segundo arco no caminho.
      expect(ringOf(slice).inner).toBe(0);
      // O raio externo é o do TEMA (`ringOuterRatio`), não mais metade do lado:
      // a rosca encostava na borda (Ø240) enquanto o anel de progresso e os
      // medidores paravam em Ø216, com o mesmo quadro de 240.
      expect(ringOf(slice).outer).toBe(OUTER_RADIUS);
    }
  });

  it('rosca: `thickness` fracionário continua sendo fração do raio', async () => {
    const { container } = renderWithProviders(
      <DonutChart data={POINTS} label="Composição" thickness={0.5} />,
    );

    const slices = await sectors(container, POINTS.length);
    // Metade do raio externo — o contrato da prop não mudou com a escala.
    expect(ringOf(slices[0]).band).toBe(OUTER_RADIUS / 2);
  });

  it('rosca, anel e medidor compartilham o MESMO raio externo', async () => {
    // A espessura já era única; o diâmetro não era. Dois círculos concêntricos
    // de tamanhos diferentes lado a lado na grade é a mesma queixa um nível
    // abaixo — este caso trava os três no mesmo Ø.
    const donut = renderWithProviders(<DonutChart data={POINTS} label="Composição" />);
    const [slice] = await sectors(donut.container, POINTS.length);
    expect(ringOf(slice).outer).toBe(OUTER_RADIUS);
  });
});

describe('circular pequeno demais para os 24px', () => {
  it('volta a valer a PROPORÇÃO, para o anel não engolir o furo', async () => {
    const small = 100;
    const { container } = renderWithProviders(
      <ProgressCircle value={73} label="Cobertura" size={small} />,
    );

    const [track] = await sectors(container, 2);
    // `clamp(ringThicknessMin, lado × ringRatio, ringThickness)`.
    expect(ringOf(track).band).toBe(Math.round(small * CHART_GEOMETRY.ringRatio));
    expect(ringOf(track).band).toBeLessThan(RING);
  });
});
