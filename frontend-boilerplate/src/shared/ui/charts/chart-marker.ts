/**
 * MARCADOR — a leitura ÚNICA de `markerVisibleSize`.
 * ============================================================================
 *
 * `CHART_GEOMETRY.markerVisibleSize` (6) é DIÂMETRO. Nem o SVG nem o d3 falam
 * essa língua: o `<circle>` pede RAIO e o símbolo do recharts pede ÁREA. A
 * conversão é obrigatória — o que não podia era cada gráfico fazer a sua:
 *
 *   line-chart     `r = 6`            ponto de 12px .......... o DOBRO
 *   area-chart     `r = 6`            ponto de 12px .......... o DOBRO
 *   spark-chart    `r = 6 / 2`        ponto de 6px ........... o previsto
 *   scatter-chart  `size = π × 6²`    r = 6 → 12px ........... 4× a ÁREA
 *
 * Três leituras do mesmo token, lado a lado na mesma grade do `/catalog`: era
 * por isso que a linha aparecia com ponto gordo ao lado de um mini-gráfico com
 * ponto fino. Daqui para frente a divisão acontece UMA vez — aqui — e os quatro
 * tipos consomem o resultado. Nenhum deles volta a tocar em `markerVisibleSize`
 * direto; é essa regra, e não o valor, que impede o defeito de voltar.
 *
 * ---------------------------------------------------------------------------
 * POR QUE O CONTORNO ENCOLHE JUNTO
 * ---------------------------------------------------------------------------
 * `markerStrokeWidth` (3) foi especificado ao lado de um marcador lido como
 * raio — é METADE dele. Só que traço de SVG fica CENTRADO no caminho: num ponto
 * de `r = 3`, um contorno de 3px pinta de `r = 1,5` a `r = 4,5`. Ou seja, come
 * metade do miolo (sobra um disco de 3px) e ainda estica a marca para 9px de
 * fora a fora — o token de diâmetro deixa de descrever o que aparece na tela e
 * o ponto lê como ANEL, que é a queixa do `/catalog`.
 *
 * A correção preserva a PROPORÇÃO da referência (contorno = metade do
 * marcador), aplicando-a ao raio, que é o que o SVG desenha: o mesmo divisor 2
 * que converte o diâmetro em `r` converte o contorno em halo. Dá 1,5px —
 * miolo de 4,5px (75% do diâmetro), halo de 1,5px, marca de 7,5px de fora a
 * fora. O halo continua fazendo o serviço dele, que é descolar o ponto da
 * linha por baixo, sem virar a figura principal.
 *
 * Não é invenção nova: `docs/charts/NOTAS.md` (`[SUB-07]`) já registrava que o
 * motor original desenha o ponto da dispersão com contorno de 2px e que os 3px
 * do tema entraram só para não cravar número no componente — com pedido de
 * "largura FINA de contorno" aberto em `PEDIDOS-BASE.md`. 1,5px atende esse
 * pedido SEM número novo: sai da razão que a própria referência declara.
 *
 * Nenhum número novo entra neste arquivo: tudo sai de `chart-theme` pelo
 * `useChartPalette`. Ficaria melhor AO LADO de `chartRingThickness()`, dentro
 * do `chart-theme` (é a mesma natureza: geometria derivada do token) — está
 * aqui só porque o tema é de outro dono neste lote.
 */
import type { ChartPalette } from './use-chart-palette';

/** Props de marcador que o recharts aceita em `dot`/`activeDot`. */
export interface ChartMarkerProps {
  /** Raio do círculo, em px. */
  r: number;
  /** Preenchimento — a cor da série (ou a escurecida, no hover). */
  fill: string;
  /** Contorno na cor da superfície, para descolar o ponto do traço. */
  stroke: string;
  /** Espessura do contorno, em px. */
  strokeWidth: number;
}

/**
 * RAIO do marcador, em px. O token é diâmetro; o SVG pede raio.
 * É a única divisão por 2 que existe no data-viz do catálogo.
 */
export function chartMarkerRadius(palette: ChartPalette): number {
  return palette.geometry.markerVisibleSize / 2;
}

/**
 * Espessura do contorno do marcador, em px — o halo.
 *
 * Mesmo divisor do raio (ver o cabeçalho): a referência quer o contorno com
 * metade do marcador, e o marcador que o SVG desenha é o RAIO.
 */
export function chartMarkerStrokeWidth(palette: ChartPalette): number {
  return palette.geometry.markerStrokeWidth / 2;
}

/**
 * ÁREA do símbolo, em px² — a unidade que o `<ZAxis>` da dispersão usa (o
 * recharts repassa o valor ao `d3.symbol().size()`, que mede por área).
 *
 * Sai do MESMO raio dos demais tipos: `π · r²`. A conta antiga usava o
 * diâmetro como se fosse raio (`π · d²`) e entregava quatro vezes a área —
 * um ponto de dispersão do dobro do diâmetro do ponto da linha.
 */
export function chartMarkerArea(palette: ChartPalette): number {
  return Math.PI * chartMarkerRadius(palette) ** 2;
}

/**
 * Marcador completo dos tipos COM EIXO (linha, área, dispersão): raio, halo e
 * a cor da série. `fill` é a única variável — cor normal no ponto de repouso,
 * escurecida no ponto ativo (a referência ESCURECE no hover).
 *
 * @example
 * <Line dot={chartMarkerProps(palette, palette.colorAt(i))} />
 */
export function chartMarkerProps(palette: ChartPalette, fill: string): ChartMarkerProps {
  return {
    r: chartMarkerRadius(palette),
    fill,
    stroke: palette.chrome('markerStroke'),
    strokeWidth: chartMarkerStrokeWidth(palette),
  };
}

/**
 * Marcador do MINI-GRÁFICO: o mesmo ponto de 6px, sem halo
 * (`sparkMarkerStrokeWidth` = 0, `04-widgets-prontos.md` §2.3).
 *
 * O spark não tem eixo nem grade — não há nada de que descolar o ponto, e um
 * anel branco em cima de 84×56px seria metade do desenho. O que ele NÃO pode
 * é ter um ponto de tamanho diferente do gráfico grande: o card de resumo
 * costuma aparecer na mesma tela que a linha.
 */
export function chartSparkMarkerProps(
  palette: ChartPalette,
  fill: string,
): Omit<ChartMarkerProps, 'stroke'> {
  return {
    r: chartMarkerRadius(palette),
    fill,
    strokeWidth: palette.geometry.sparkMarkerStrokeWidth,
  };
}
