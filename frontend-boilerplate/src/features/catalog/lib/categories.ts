/**
 * Categorias de UI da galeria do catálogo (`/catalog`) — as ABAS.
 *
 * Camada PURAMENTE de apresentação, isolada na feature `catalog`. NÃO toca o
 * `BlockManifest` (contrato compartilhado FE+BE+IA, `additionalProperties:false`)
 * nem o `kind` técnico do render-engine (que carrega semântica de render — define
 * se o bloco recebe a moldura `ChartWidget`). Aqui só mapeamos cada `catalogType`
 * a uma das 7 categorias semânticas exibidas como abas.
 *
 * Tipos não mapeados caem em `outros` (fallback seguro): um bloco novo nunca
 * "some" da galeria — aparece numa aba "Outros" até ser classificado aqui.
 */

/**
 * Ordem das abas. `outros` é fallback (só renderiza se houver bloco órfão).
 *
 * `listas` foi REMOVIDA: nenhum bloco apontava para ela (os rankings vivem em
 * `tabelas` e `bar_list` em `graficos`), então ela era uma aba que nunca
 * aparecia — código morto que fazia a contagem de categorias do arquivo
 * discordar do que a tela mostra.
 */
export const CATEGORIES = [
  'graficos',
  'indicadores',
  'tabelas',
  'layout',
  'efeitos',
  'texto',
  'outros',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Rótulo PT-BR de cada categoria (texto da aba). */
export const CATEGORY_LABEL: Record<Category, string> = {
  graficos: 'Gráficos',
  indicadores: 'Cards & Métricas',
  tabelas: 'Tabelas',
  layout: 'Layout',
  efeitos: 'Efeitos',
  texto: 'Texto',
  outros: 'Outros',
};

/**
 * Uma linha por categoria explicando QUANDO usar aquele grupo. A aba sozinha
 * diz "o que é"; isto diz "para qual pergunta serve" — que é como quem monta um
 * relatório (e o agente) escolhe um bloco.
 */
export const CATEGORY_HINT: Record<Category, string> = {
  graficos: 'Comparar, acompanhar tendência ou mostrar parte do todo.',
  indicadores: 'Destacar um número único e o seu estado.',
  tabelas: 'Mostrar os registros linha a linha, com ordenação.',
  layout: 'Agrupar outros blocos: seções, painéis e containers.',
  efeitos: 'Enfeite visual — não carrega dado nem informação.',
  texto: 'Narrativa: títulos, resumos e comentários do relatório.',
  outros: 'Blocos ainda não classificados.',
};

/** Índice de ordenação das categorias (segue a ordem de `CATEGORIES`). */
export const CATEGORY_ORDER: Record<Category, number> = Object.fromEntries(
  CATEGORIES.map((c, i) => [c, i] as const),
) as Record<Category, number>;

/**
 * Mapa `catalogType → categoria`. Mantido à mão (território da galeria); não é
 * um índice central do render-engine (não viola a regra de auto-registro por
 * glob). Bloco novo fora do mapa cai em `outros` via `categoryOf`.
 */
export const CATEGORY_BY_TYPE: Record<string, Category> = {
  // 📊 Gráficos — visualização multi-ponto (série / categoria / distribuição)
  line_chart: 'graficos',
  area_chart: 'graficos',
  bar_chart: 'graficos',
  h_bar_chart: 'graficos',
  donut: 'graficos',
  scatter_chart: 'graficos',
  spark_chart: 'graficos',
  bar_list: 'graficos',
  // 📊 Medidores (valor sobre escala) — também são gráficos.
  radial_gauge: 'graficos',
  progress_circle: 'graficos',
  progress_bar: 'graficos',
  // Funil é comparação entre etapas — é gráfico, não "outros". Estava fora do
  // mapa e caía sozinho na aba de fallback.
  funnel_stage: 'graficos',

  // 🔔 Cards, Métricas & Indicadores — valor único (escalar) + alertas
  kpi: 'indicadores',
  stat_tile: 'indicadores',
  metric_glow: 'indicadores',
  signal_card: 'indicadores',
  alert: 'indicadores',
  callout: 'indicadores',

  // 🧮 Tabelas & Rankings
  table: 'tabelas',
  data_table: 'tabelas',
  invoice_table: 'tabelas',
  leaderboard: 'tabelas',

  // 🧱 Layout & Containers (aceitam children)
  //
  // O sistema de layout foi reduzido a um contêiner de grade (`grid`) e às três
  // formas de embrulhá-lo: com nome (`section`), recolhível
  // (`collapsible_block`) e fora do fluxo (`sheet`) — mais o separador.
  //
  // Saíram daqui `dashboard_panel` (era `section` com outro nome), `bento_grid`
  // (virou `grid` com `itemSizing: 'span'`), `expandable_cards` e
  // `resizable_panels` (padrões de INTERAÇÃO, não de organização: impunham card
  // em cada filho e altura fixa, e é o que produzia as composições desiguais).
  grid: 'layout',
  section: 'layout',
  collapsible_block: 'layout',
  sheet: 'layout',
  divider: 'layout',

  // ✨ Efeitos & Decorativos
  //
  // Sete blocos saíram do catálogo por decisão de produto (não seriam usados):
  // `background_beams`, `background_boxes`, `glowing_effect`, `pin_3d`,
  // `tooltip_card`, `tooltip_fluid` e `card_hover`. Depois saiu também o
  // `hover_card` (conteúdo flutuante no hover): não organizava nada e não
  // sobrevivia à exportação em PDF nem ao toque. Sobrou o indicador de
  // carregamento.
  mobius_loop: 'efeitos',

  // 🔤 Texto & Títulos
  title: 'texto',
  rich_text: 'texto',
  flip_words: 'texto',
};

/** Categoria de um `catalogType` (fallback `outros`). */
export function categoryOf(type: string): Category {
  return CATEGORY_BY_TYPE[type] ?? 'outros';
}
