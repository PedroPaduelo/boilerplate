/**
 * TAMANHO PADRÃO por tipo de bloco — quanta altura o corpo de um gráfico
 * reserva, quais blocos são compactos a ponto de caberem lado a lado, e (a
 * partir da repaginação de layout) qual é a ALTURA e a LARGURA de uma LINHA de
 * blocos.
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
 *
 * É de propósito que este arquivo concentre NÚMEROS: é o mesmo padrão do
 * `chart-theme` ("um arquivo com as medidas, o resto consumindo"). Altura de
 * linha e piso de coluna são medidas de COMPOSIÇÃO — o design system não tem
 * slot para elas, e espalhá-las pelos blocos é como o catálogo chegou a ter
 * sete espessuras para a mesma barra.
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
  /**
   * Etapa de funil NÃO é série: é uma LINHA (cabeçalho + resumo + barra) que só
   * cresce quando o usuário abre a tabela de desfechos. Estava em `series` e
   * reservava **388px para ~142px de conteúdo** — 246px de vazio dentro do card,
   * o bloco visivelmente mais alto do que qualquer outro no mesmo dashboard.
   * `compact` é a medida do que ele desenha fechado; abrir a tabela é ação do
   * usuário, e crescer aí não é pulo de layout.
   */
  funnel_stage: 'compact',
  /**
   * Grafo pede AMPLITUDE nos dois eixos: a rede se abre em todas as direções e,
   * espremida, vira um novelo. Fica no degrau da série (o mais alto), que é o
   * mesmo da dispersão — o outro tipo cujo dado é uma nuvem de marcas.
   */
  graph_chart: 'series',
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
 * SILHUETA do esqueleto de carregamento deste tipo.
 *
 * Mora aqui, junto da política de tamanho, porque responde à mesma pergunta —
 * "que forma este tipo tem?" — e porque assim a silhueta acompanha a família de
 * tamanho: se um tipo mudar de família, o esqueleto muda junto, em vez de as
 * duas tabelas divergirem em silêncio.
 *
 * O mapeamento é por FORMA DE LEITURA, não um desenho por tipo: quatro
 * silhuetas diferentes para quatro jeitos de desenhar uma série ensinariam ao
 * olho uma diferença que não existe.
 */
export function skeletonShapeFor(type: string): 'bars' | 'line' | 'circular' | 'rows' {
  const size = SIZE_BY_TYPE[type];
  if (size === 'table') return 'rows';
  if (size === 'categorical') {
    // Composição de um todo desenha um anel; ranking desenha faixas.
    return type === 'donut' || type === 'progress_circle' || type === 'radial_gauge'
      ? 'circular'
      : 'rows';
  }
  // Séries mostram tendência (linha); comparações mostram grandeza (barras).
  if (type === 'line_chart' || type === 'area_chart' || type === 'spark_chart') {
    return 'line';
  }
  return 'bars';
}

/**
 * Largura mínima de um cartão compacto numa grade. Abaixo disto o rótulo
 * ("Eventos de webhook") quebra em três linhas e o número perde o destaque —
 * é o piso que decide quantas colunas cabem.
 */
export const COMPACT_CARD_MIN_WIDTH = 220;

/** Teto de colunas da grade de cartões compactos. */
export const COMPACT_CARD_MAX_COLUMNS = 4;

/* ========================================================================== *
 * LINHA DE BLOCOS — altura e largura de uma faixa do grid
 * ========================================================================== *
 *
 * A queixa que originou esta seção: "gráficos na mesma linha devem ter sempre o
 * mesmo tamanho — nunca um maior que o outro" e "a linha precisa ter altura
 * definida, senão as linhas ficam grandes demais".
 *
 * As duas têm a MESMA causa: até aqui ninguém decidia o tamanho de uma linha.
 * A largura saía do `span` que o autor tivesse escrito em cada bloco (7 e 5
 * viram 58% e 42% — desiguais por acidente) e a altura saía do bloco mais alto
 * que tivesse caído ali (um KPI ao lado de uma série herdava os 388px da
 * série e virava um retângulo vazio).
 *
 * A partir daqui a LINHA é a unidade de decisão: ela escolhe UM degrau de
 * altura — o da família mais alta que ela contém — e todos os seus itens ficam
 * com esse tamanho. Uma linha só de KPIs é baixa; uma linha de séries é alta;
 * uma linha de texto não reserva altura nenhuma. É isso que impede tanto o
 * "desigual" quanto o "grande demais".
 */

/**
 * Degrau de altura de uma linha de blocos.
 *
 * `auto` NÃO é "sem altura": é "a altura do conteúdo manda", o que só vale para
 * linhas inteiramente narrativas (título, texto, divisor). Reservar altura para
 * texto abriria justamente o buraco que a seção acima descreve.
 */
export type BlockRowHeight = 'auto' | 'compact' | 'default' | 'tall';

/**
 * Cromo do card emoldurado (`BlockFrame`) somado ao corpo do gráfico: o
 * cabeçalho, o padding do corpo e a faixa de leitura (`takeaways`).
 * `CHART_BODY_HEIGHT` já cobre o desenho e a legenda; o que falta para a
 * altura TOTAL do card é isto.
 *
 * Por que somar em vez de chutar um número redondo: a altura da linha precisa
 * ser MAIOR OU IGUAL ao que o card pede, senão ela deixa de ser um piso e vira
 * um corte — e um gráfico cortado é pior que um gráfico grande.
 *
 * 112 é MEDIDO, não estimado. O valor anterior (72) era uma conta de cabeça que
 * só somava cabeçalho e respiro; no navegador, um card de série dá 498px para
 * um corpo de 388px — 110px de cromo, porque a faixa de takeaways (2 linhas,
 * ~59px) também mora fora do corpo. Com 72 a "altura de linha" nascia menor que
 * o card que ela deveria pisar, ou seja: não pisava nada.
 */
const FRAME_CHROME_HEIGHT = 112;

/**
 * Altura de cada degrau, em px. Derivada de `CHART_BODY_HEIGHT` (medida) e não
 * arbitrada: assim a linha acompanha automaticamente qualquer recalibragem da
 * altura de corpo, sem duas escalas divergirem com o tempo.
 *
 *   compact  160  cartão de número — rótulo, valor e variação, nada mais
 *   default  440  328 (composição/ranking/tabela) + 112 de cromo
 *   tall     500  388 (série temporal)            + 112 de cromo
 *
 * Conferido no navegador depois de calibrar: card de série 498px, card de
 * composição 485px — ou seja, os degraus passam a pisar de verdade o que o
 * card mede, em vez de ficar 40px abaixo dele.
 */
export const BLOCK_ROW_HEIGHT = {
  compact: CHART_BODY_HEIGHT.compact,
  default: CHART_BODY_HEIGHT.categorical + FRAME_CHROME_HEIGHT,
  tall: CHART_BODY_HEIGHT.series + FRAME_CHROME_HEIGHT,
} as const;

/**
 * Piso de largura de uma coluna de bloco de DADOS. Abaixo disto o eixo Y come
 * o desenho e a legenda quebra em três linhas — é o que decide quantas colunas
 * cabem antes de a grade colapsar.
 *
 * É maior que `COMPACT_CARD_MIN_WIDTH` (220) de propósito: um cartão de número
 * cabe em 220px, um gráfico com eixo não.
 */
export const BLOCK_COLUMN_MIN_WIDTH = 280;

/**
 * Teto de colunas de uma linha de blocos de dados.
 *
 * Três, e não quatro: a partir da quarta coluna um gráfico com eixo fica mais
 * alto que largo em telas de trabalho — a forma que a queixa chamou de
 * "gráfico grande demais quando a linha não exige isso". Cartões de número
 * continuam podendo quatro (`COMPACT_CARD_MAX_COLUMNS`), porque um número não
 * tem eixo para espremer.
 */
export const BLOCK_MAX_COLUMNS = 3;

/** Ordem dos degraus — a linha adota o MAIOR entre os seus blocos. */
const ROW_HEIGHT_ORDER: BlockRowHeight[] = ['auto', 'compact', 'default', 'tall'];

/** Família de corpo → degrau de linha. */
const ROW_HEIGHT_BY_SIZE: Record<ChartBodySize, BlockRowHeight> = {
  compact: 'compact',
  categorical: 'default',
  table: 'default',
  series: 'tall',
};

/** Degrau de linha exigido por UM bloco, isoladamente. */
export function rowHeightForType(type: string): BlockRowHeight {
  if (COMPACT_CARD_TYPES.has(type)) return 'compact';
  const size = SIZE_BY_TYPE[type];
  return size ? ROW_HEIGHT_BY_SIZE[size] : 'auto';
}

/**
 * Degrau de uma LINHA a partir dos tipos que ela contém: o maior exigido por
 * qualquer um deles.
 *
 * Adotar o maior (e não a média, nem o do primeiro) é o que garante que a
 * altura seja um PISO e nunca um corte: o bloco mais exigente cabe, e os
 * demais esticam até ele — que é exatamente "todos do mesmo tamanho".
 *
 * Linha vazia → `auto`: um grid sem filhos não deve reservar 460px de nada.
 */
export function rowHeightForTypes(types: readonly string[]): BlockRowHeight {
  let step: BlockRowHeight = 'auto';
  for (const type of types) {
    const candidate = rowHeightForType(type);
    if (ROW_HEIGHT_ORDER.indexOf(candidate) > ROW_HEIGHT_ORDER.indexOf(step)) {
      step = candidate;
    }
  }
  return step;
}

/**
 * Altura em px de um degrau. `undefined` em `auto` — e `undefined` aqui
 * significa "não escreva altura nenhuma", não "escreva zero".
 */
export function rowHeightPx(step: BlockRowHeight): number | undefined {
  return step === 'auto' ? undefined : BLOCK_ROW_HEIGHT[step];
}

/* ========================================================================== *
 * ALTURA DECLARADA — o que o AUTOR do dashboard pediu
 * ========================================================================== *
 *
 * Tudo acima responde "que altura este conteúdo PEDE?". Esta seção responde a
 * outra pergunta: "que altura a PESSOA pediu?".
 *
 * As duas convivem por prioridade, nunca por mistura: havendo altura declarada
 * (no bloco ou na linha), ela manda; não havendo, a derivação por tipo segue
 * decidindo. É o mesmo desenho do editor de painéis do Grafana, onde a altura
 * da linha é um degrau nomeado com uma saída para pixels — e é deliberado que
 * o degrau venha primeiro: ele acompanha qualquer recalibragem futura das
 * medidas acima, enquanto um número gravado no JSON congela para sempre.
 */

/** Altura declarada: um degrau nomeado ou uma medida em pixels. */
export type BlockHeight = BlockRowHeight | number;

/** Piso e teto do modo pixels. Fora disso não é altura, é acidente. */
export const BLOCK_HEIGHT_PX_MIN = 120;
export const BLOCK_HEIGHT_PX_MAX = 1600;

/** É um degrau nomeado do vocabulário? */
export function isBlockRowHeight(value: unknown): value is BlockRowHeight {
  return (
    value === 'auto' || value === 'compact' || value === 'default' || value === 'tall'
  );
}

/**
 * Lê uma altura declarada vinda do layout (JSON de terceiro/IA) e devolve os
 * pixels correspondentes.
 *
 * Segue a REGRA DE LEITURA do motor: valor fora do vocabulário é IGNORADO, não
 * corrigido — um `height: "gigante"` degrada para a derivação por tipo em vez
 * de derrubar o bloco. Número fora da faixa é grampeado, porque ali a intenção
 * é inequívoca (a pessoa quis um número; só quis um impossível).
 *
 * `undefined` significa "nada declarado" — e é diferente de `'auto'`, que é uma
 * declaração ativa de "sem altura reservada".
 */
export function declaredHeightPx(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(
      BLOCK_HEIGHT_PX_MIN,
      Math.min(BLOCK_HEIGHT_PX_MAX, Math.round(value)),
    );
  }
  if (isBlockRowHeight(value)) return rowHeightPx(value);
  return undefined;
}

/** Há uma altura declarada legível neste valor? */
export function hasDeclaredHeight(value: unknown): boolean {
  return isBlockRowHeight(value) || (typeof value === 'number' && Number.isFinite(value));
}

/**
 * Piso do CORPO de um gráfico emoldurado. Abaixo disto o desenho some atrás do
 * cabeçalho: é o mínimo para o gráfico ainda ser um gráfico, não a intenção do
 * autor sendo ignorada.
 */
export const FRAMED_BODY_MIN_HEIGHT = 96;

/**
 * Converte a altura de CÉLULA declarada pelo autor (`row.height`/`block.height`,
 * já em px) na altura do CORPO do gráfico dentro da moldura.
 *
 * A célula é o card inteiro (cromo + corpo); o gráfico ocupa só o corpo. Descontar
 * o cromo aqui é o INVERSO exato de como `BLOCK_ROW_HEIGHT` foi derivado
 * (`corpo + FRAME_CHROME_HEIGHT`): uma linha declarada `tall` (500px) devolve
 * 388px de corpo — o mesmo que a série reserva por tipo. Sem este desconto, a
 * altura declarada só empurrava a moldura para baixo e o desenho continuava do
 * tamanho fixo do tipo — a queixa de \"o gráfico não respeita o tamanho\".
 *
 * O piso (`FRAMED_BODY_MIN_HEIGHT`) existe porque um framed chart tem ~112px de
 * cromo: declarar uma altura minúscula não pode zerar o desenho.
 */
export function bodyHeightForCell(cellPx: number): number {
  return Math.max(FRAMED_BODY_MIN_HEIGHT, Math.round(cellPx) - FRAME_CHROME_HEIGHT);
}

/**
 * Política de COLUNA de uma linha: qual o piso de largura de cada coluna e
 * quantas cabem, no máximo.
 *
 * Depende do degrau porque as duas famílias têm pisos diferentes: quatro
 * cartões de número numa linha é uma leitura de painel; quatro gráficos com
 * eixo na mesma largura é um amontoado. Ter a política aqui (e não no
 * componente) é o que mantém dashboard, seção e chat com a mesma grade.
 */
export function columnPolicyFor(step: BlockRowHeight): {
  minWidth: number;
  maxColumns: number;
} {
  if (step === 'compact' || step === 'auto') {
    return {
      minWidth: COMPACT_CARD_MIN_WIDTH,
      maxColumns: COMPACT_CARD_MAX_COLUMNS,
    };
  }
  return { minWidth: BLOCK_COLUMN_MIN_WIDTH, maxColumns: BLOCK_MAX_COLUMNS };
}
