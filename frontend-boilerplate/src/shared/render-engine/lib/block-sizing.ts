/**
 * TAMANHO PADRÃO por tipo de bloco — quanta altura o corpo de um gráfico
 * reserva, e quais blocos são compactos a ponto de caberem lado a lado.
 *
 * Dois problemas resolvidos aqui, ambos observados na tela (uma resposta com
 * 7 gráficos seguidos):
 *
 *  1. ESCALA ERRADA. Um KPI é uma frase de um número; uma série temporal é uma
 *     leitura de tendência. Quando os dois recebem a mesma caixa, o KPI vira
 *     um número minúsculo perdido num retângulo largo (medimos 95 px de altura
 *     esticados por 1086 px de largura) e a série fica apertada. Tamanho é
 *     hierarquia: quem diz menos ocupa menos.
 *
 *  2. PULO DE LAYOUT. Sem altura reservada, o card nasce do tamanho do
 *     esqueleto e cresce quando o dado chega, empurrando o texto que o usuário
 *     está lendo (doc `composicao-da-resposta` §6). Reservar a altura FINAL
 *     desde o esqueleto troca o pulo por uma caixa estável que se preenche.
 *
 * Os números não são estéticos: saíram da medição dos blocos já renderizados
 * (donut ~200 px, barras 280–307 px conforme a legenda, lista de barras
 * ~194 px), arredondados para cima na escala de 4 px do design system. Reservar
 * pelo MAIOR caso comum é deliberado — sobrar 12 px de respiro é invisível,
 * faltar 27 px é o pulo que se quer eliminar.
 */

/**
 * Altura reservada ao CORPO de um bloco de gráfico, em pixels.
 *
 * ATUALIZADO na repaginação: a referência de design fixa **320px** de desenho
 * para 13 dos 18 tipos (`01-fundamentos.md` §7), e o corpo do card ainda soma o
 * padding assimétrico (20px em cima e embaixo) e a legenda no rodapé. Com os
 * 312px antigos o card crescia ~35px na chegada do dado — exatamente o pulo que
 * este arquivo existe para evitar. Os números abaixo são a soma real:
 *
 *   série       320 (desenho) + 40 (padding) + 28 (legenda) = 388
 *   categórico  240 (anel)    + 40 (padding) + 48 (legenda própria, 2 linhas) = 328
 */
export const CHART_BODY_HEIGHT = {
  /** Séries e comparações: precisam de amplitude vertical para a leitura. */
  series: 388,
  /** Composições e rankings: o desenho é largo, não alto. */
  categorical: 328,
  /** Medidores e mini-gráficos: existem para caber num canto. */
  compact: 160,
  /** Tabelas: várias linhas por definição. */
  table: 320,
} as const;

export type ChartBodySize = keyof typeof CHART_BODY_HEIGHT;

/**
 * Tipo de bloco → família de tamanho. Só blocos de VISUALIZAÇÃO aparecem: os
 * narrativos (título, texto rico, divisor) têm a altura do próprio conteúdo, e
 * reservar espaço para texto criaria o buraco que se quer evitar.
 */
const SIZE_BY_TYPE: Record<string, ChartBodySize> = {
  // Séries / comparação entre categorias.
  area_chart: 'series',
  bar_chart: 'series',
  h_bar_chart: 'series',
  line_chart: 'series',
  scatter_chart: 'series',
  funnel_stage: 'series',
  // Composição de um todo / rankings.
  donut: 'categorical',
  bar_list: 'categorical',
  leaderboard: 'categorical',
  progress_circle: 'categorical',
  radial_gauge: 'categorical',
  // Mini-gráficos e medidores.
  spark_chart: 'compact',
  progress_bar: 'compact',
  // Tabulares.
  data_table: 'table',
  invoice_table: 'table',
  table: 'table',
};

/**
 * Blocos que JÁ são um cartão de número (KPIs e métricas): não têm "corpo de
 * gráfico" para reservar e, por serem baixos, ficam melhor LADO A LADO do que
 * empilhados — quatro deles em coluna viram quatro faixas largas e vazias.
 *
 * A lista espelha `SELF_CONTAINED` do `block-renderer` (os que não recebem
 * moldura). Andam juntas porque respondem à mesma pergunta — "este bloco já é
 * um card?" —, mas continuam separadas: uma decide MOLDURA, esta decide
 * TAMANHO, e um bloco futuro pode precisar de uma sem a outra.
 */
const COMPACT_CARD_TYPES = new Set<string>([
  'kpi',
  'metric_glow',
  'stat_tile',
  'signal_card',
]);

/**
 * Altura reservada ao corpo do gráfico deste tipo. `undefined` para blocos que
 * não são gráfico (narrativos, containers) e para os cartões compactos, que
 * têm altura própria — nesses casos o chamador não deve reservar nada.
 */
export function chartBodyHeight(type: string): number | undefined {
  if (COMPACT_CARD_TYPES.has(type)) return undefined;
  const size = SIZE_BY_TYPE[type];
  return size ? CHART_BODY_HEIGHT[size] : undefined;
}

/** É um cartão de número (baixo, agrupável lado a lado)? */
export function isCompactCardBlock(type: string): boolean {
  return COMPACT_CARD_TYPES.has(type);
}

/**
 * Largura mínima de um cartão compacto numa grade. Abaixo disto o rótulo
 * ("Eventos de webhook") quebra em três linhas e o número perde o destaque —
 * é o piso que decide quantas colunas cabem.
 */
export const COMPACT_CARD_MIN_WIDTH = 220;

/** Teto de colunas da grade de cartões compactos. */
export const COMPACT_CARD_MAX_COLUMNS = 4;
