/**
 * Regressão de ESPESSURA das barras de LISTA — as que NÃO têm eixo e
 * acompanham uma linha de texto: ranking (`BarList`/`RankingBar`), trilho da
 * base (`ChartBarTrack`, usado pelo progresso linear) e etapa de funil.
 *
 * O defeito que este arquivo tranca: cada uma dessas barras herdou a espessura
 * da seção da referência que descreve o seu tipo, sempre como FRAÇÃO de outra
 * medida — o ranking tirava de `RANKING_ROW_BAND × hBarWidth` (≈10px), o trilho
 * da base de `--spacing-1-5`/`--spacing-2` (6 e 8px, conforme a prop `size`), a
 * etapa de funil de `--spacing-4` (16px). Nenhum dos três estava errado sozinho;
 * lado a lado na grade do `/catalog` eram três componentes de origens
 * diferentes desenhando a MESMA marca de dado.
 *
 * A regra do sistema é uma só: **sem eixo e ao lado de texto ⇒
 * `geometry.trackThickness`**. Este teste afirma o degrau (uma vez) e depois
 * afirma que os componentes o consomem — não repete o número em cada caso, que
 * é justamente o hábito que produziu cinco espessuras.
 *
 * Complementa `bar-thickness.test.tsx`, que cobre o outro lado da escala: as
 * barras COM eixo (coluna e barra horizontal), medidas em SVG pelo recharts.
 * Aqui é DOM, então a medida é lida do atributo `style`.
 */
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  CHART_CHROME_TOKENS,
  CHART_GEOMETRY,
  ChartBarTrack,
  RankingBar,
} from '@/shared/ui';
import { definition as funnelStage } from '@/shared/render-engine/catalog/funnel_stage/component';
import { fixture as funnelFixture } from '@/shared/render-engine/catalog/funnel_stage/fixture';

/** A quarta barra de lista mora num bloco, não em `shared/ui` — ver o caso final. */
const FunnelStageBlock = funnelStage.Component;
const FUNNEL_PROPS = { stageLabel: 'N1 · MOMENTO LANÇAMENTO' };

/** Cor de entrada da barra: quem resolve token é a paleta, não este teste. */
const COLOR = 'rgb(0, 120, 103)';

/** `style` de um elemento, como string — é onde a medida do desenho aparece. */
const styleOf = (node: Element | null | undefined): string =>
  node?.getAttribute('style') ?? '';

/** Trilho e preenchimento de uma barra de lista, no par em que são desenhados. */
function barPair(container: HTMLElement, slot: string) {
  const track = container.querySelector(`[data-slot="${slot}"]`);
  return { track, fill: track?.firstElementChild };
}

describe('escala de espessura — degrau de lista', () => {
  it('tem UM degrau para barra sem eixo, e ele vale 12px', () => {
    // O número medido no `/catalog` e acordado na escala. Mexer aqui é decisão
    // de ESCALA (`chart-theme`), não de componente — por isso ele é afirmado
    // uma vez só, neste caso, e nunca repetido nos demais.
    expect(CHART_GEOMETRY.trackThickness).toBe(12);
  });
});

describe('barra de ranking (RankingBar)', () => {
  it('usa o degrau de lista, não mais a fração da faixa da linha', () => {
    const { container } = renderWithProviders(<RankingBar ratio={0.5} color={COLOR} />);
    const { track } = barPair(container, 'ranking-bar');

    // Antes: `Math.round(RANKING_ROW_BAND * hBarWidth)` = 10px.
    expect(styleOf(track)).toContain(`block-size: ${CHART_GEOMETRY.trackThickness}px`);
  });

  it('desenha a trilha com a MESMA espessura da barra, mudando só a cor', () => {
    const { container } = renderWithProviders(<RankingBar ratio={0.5} color={COLOR} />);
    const { track, fill } = barPair(container, 'ranking-bar');

    // O preenchimento não declara espessura própria: herda a do trilho por
    // `h-full`. Não há como as duas divergirem — que é o ponto.
    expect(fill?.className).toContain('h-full');
    expect(styleOf(fill)).not.toContain('block-size');
    expect(styleOf(fill)).not.toContain('height');

    // A única diferença entre trilha e barra é a cor.
    expect(styleOf(track)).toContain(`var(${CHART_CHROME_TOKENS.trackLight})`);
    expect(styleOf(fill)).toContain(COLOR);
  });

  it('arredonda com o raio da barra horizontal, igual no trilho e na barra', () => {
    const { container } = renderWithProviders(<RankingBar ratio={0.5} color={COLOR} />);
    const { track, fill } = barPair(container, 'ranking-bar');
    const radius = `border-radius: ${CHART_GEOMETRY.barRadiusFlat}px`;

    // 2px: nem o raio 4px da COLUNA (degrau de 32px), nem cápsula — que
    // arredondaria a ponta que carrega o dado.
    expect(styleOf(track)).toContain(radius);
    expect(styleOf(fill)).toContain(radius);
  });
});

describe('trilho da base (ChartBarTrack)', () => {
  it('tem a mesma espessura nos dois tamanhos — `size` não é mais medida', () => {
    const small = renderWithProviders(<ChartBarTrack ratio={0.25} color={COLOR} />);
    const medium = renderWithProviders(
      <ChartBarTrack ratio={0.25} color={COLOR} size="md" />,
    );

    const thickness = `block-size: ${CHART_GEOMETRY.trackThickness}px`;
    expect(styleOf(barPair(small.container, 'chart-bar-track').track)).toContain(
      thickness,
    );
    expect(styleOf(barPair(medium.container, 'chart-bar-track').track)).toContain(
      thickness,
    );
  });

  it('desenha a trilha com a MESMA espessura da barra, mudando só a cor', () => {
    const { container } = renderWithProviders(
      <ChartBarTrack ratio={0.25} color={COLOR} />,
    );
    const { track, fill } = barPair(container, 'chart-bar-track');

    expect(fill?.className).toContain('h-full');
    expect(styleOf(fill)).not.toContain('block-size');
    expect(styleOf(track)).toContain(`var(${CHART_CHROME_TOKENS.track})`);
    expect(styleOf(fill)).toContain(COLOR);
  });
});

describe('a mesma marca, o mesmo peso', () => {
  it('ranking e trilho da base desenham a barra com a mesma espessura', () => {
    const ranking = renderWithProviders(<RankingBar ratio={1} color={COLOR} />);
    const scalar = renderWithProviders(
      <ChartBarTrack ratio={1} color={COLOR} size="md" />,
    );

    const read = (style: string) => /block-size:\s*([\d.]+)px/.exec(style)?.[1];
    const rankingThickness = read(
      styleOf(barPair(ranking.container, 'ranking-bar').track),
    );
    const scalarThickness = read(
      styleOf(barPair(scalar.container, 'chart-bar-track').track),
    );

    expect(rankingThickness).toBeTruthy();
    expect(rankingThickness).toBe(scalarThickness);
  });

  it('a etapa de funil usa o mesmo degrau (era `--spacing-4`, 16px)', () => {
    // A quarta barra de lista morava em `funnel-bar.tsx` e cravava a altura numa
    // classe utilitária — 16px, herdados de uma conta feita para gráfico COM
    // eixo. Era a última espessura fora da escala, e a única que não dava para
    // ver lendo os componentes de `shared/ui`: por isso o caso vive aqui, junto
    // das irmãs, e não só na suíte do bloco.
    const { container } = renderWithProviders(
      <FunnelStageBlock props={FUNNEL_PROPS} data={funnelFixture} state="success" />,
    );
    const bar = container.querySelector('[data-slot="funnel-bar"]');

    expect(bar).toBeInTheDocument();
    expect((bar as HTMLElement).style.blockSize).toBe(
      `${CHART_GEOMETRY.trackThickness}px`,
    );
  });
});
