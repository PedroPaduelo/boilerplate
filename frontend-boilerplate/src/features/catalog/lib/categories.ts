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

/** Ordem das abas. `outros` é fallback (só renderiza se houver bloco órfão). */
export const CATEGORIES = [
  'graficos',
  'indicadores',
  'tabelas',
  'listas',
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
  listas: 'Listas',
  layout: 'Layout',
  efeitos: 'Efeitos',
  texto: 'Texto',
  outros: 'Outros',
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
  section: 'layout',
  collapsible_block: 'layout',
  resizable_panels: 'layout',
  dashboard_panel: 'layout',
  bento_grid: 'layout',
  sheet: 'layout',
  expandable_cards: 'layout',
  divider: 'layout',

  // ✨ Efeitos & Decorativos
  background_beams: 'efeitos',
  background_boxes: 'efeitos',
  glowing_effect: 'efeitos',
  mobius_loop: 'efeitos',
  pin_3d: 'efeitos',
  hover_card: 'efeitos',
  tooltip_card: 'efeitos',
  tooltip_fluid: 'efeitos',
  card_hover: 'efeitos',

  // 🔤 Texto & Títulos
  title: 'texto',
  rich_text: 'texto',
  flip_words: 'texto',
};

/** Categoria de um `catalogType` (fallback `outros`). */
export function categoryOf(type: string): Category {
  return CATEGORY_BY_TYPE[type] ?? 'outros';
}
