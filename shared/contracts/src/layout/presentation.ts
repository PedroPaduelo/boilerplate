/**
 * APRESENTAÇÃO de blocos, linhas e tema — funções PURAS, compartilhadas BE/FE/MCP.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ISTO EXISTE (e por que não mora na tela)
 * ---------------------------------------------------------------------------
 * Os campos que enriquecem um dashboard (`icon`, `unit`, `emphasis`,
 * `columns`, `itemSizing`, `theme`) são escritos pelo AGENTE, num JSON que
 * ninguém revisa antes de renderizar. Isso significa que a leitura deles é
 * sempre defensiva: valor fora do vocabulário, número absurdo, string vazia,
 * `null` no lugar de objeto.
 *
 * Se cada consumidor normalizasse por conta própria, o viewer, o export de PDF
 * e o link público discordariam sobre o que o layout diz — e o sintoma seria o
 * pior tipo: silencioso (um card em destaque numa tela e comum na outra). É a
 * mesma decisão que já vale para as ABAS em `tabs.ts`.
 *
 * REGRA DE LEITURA (a mesma do motor): valor irreconhecível é IGNORADO, nunca
 * corrigido nem propagado. Um `emphasis: "gigante"` degrada para o card comum
 * em vez de derrubar o bloco; um `columns: 40` some em vez de gerar quarenta
 * faixas de 12px.
 */
import {
  SEMANTIC_ICONS,
  type Block,
  type BlockEmphasis,
  type DashboardLayout,
  type DashboardTheme,
  type Row,
  type RowItemSizing,
  type SemanticIcon,
} from '../types';

/** O valor é um dos ícones do vocabulário? */
export function isSemanticIcon(value: unknown): value is SemanticIcon {
  return typeof value === 'string' && (SEMANTIC_ICONS as readonly string[]).includes(value);
}

/**
 * TIPO de bloco → ícone semântico padrão.
 *
 * É o que garante "ícone por tipo de gráfico" sem exigir nada do agente: ele
 * escreve `bar_chart` e o card já nasce com a âncora visual certa. Declarar
 * `block.icon` passa a ser o que deveria ser — uma exceção ("este gráfico de
 * barras é sobre dinheiro"), não uma obrigação repetida em todo bloco.
 *
 * O mapa é por FAMÍLIA de leitura, não um ícone diferente por tipo: quatro
 * ícones distintos para quatro jeitos de desenhar uma série ensinariam ao olho
 * uma diferença que não existe no dado.
 */
const ICON_BY_BLOCK_TYPE: Record<string, SemanticIcon> = {
  // Séries e comparações — a leitura é "como isto se move / se compara".
  area_chart: 'trend',
  line_chart: 'trend',
  spark_chart: 'trend',
  bar_chart: 'chart',
  h_bar_chart: 'chart',
  scatter_chart: 'chart',
  graph_chart: 'activity',
  // Composição de um todo.
  donut: 'pie',
  progress_circle: 'percent',
  progress_bar: 'percent',
  radial_gauge: 'target',
  funnel_stage: 'layers',
  // Rankings e listas.
  bar_list: 'list',
  leaderboard: 'list',
  // Tabulares.
  data_table: 'table',
  invoice_table: 'table',
  table: 'table',
  // Indicadores (cards de número).
  kpi: 'target',
  metric_glow: 'target',
  stat_tile: 'target',
  signal_card: 'alert',
  // Narrativos e estruturais.
  rich_text: 'document',
  title: 'document',
  callout: 'alert',
  alert: 'alert',
  section: 'layers',
  grid: 'layers',
  collapsible_block: 'layers',
  sheet: 'document',
  divider: 'layers',
};

/**
 * Ícone semântico de um bloco: o declarado, senão o do tipo, senão nenhum.
 *
 * `undefined` (e não um ícone genérico) quando o tipo é desconhecido: a tela
 * decide o marcador neutro, porque só ela sabe se o item está numa lista que
 * precisa de alinhamento.
 */
export function iconForBlockType(type: string | undefined): SemanticIcon | undefined {
  if (typeof type !== 'string') return undefined;
  return ICON_BY_BLOCK_TYPE[type];
}

/** Apresentação já normalizada de um bloco — pronta para o cabeçalho do card. */
export interface BlockPresentation {
  /** Ícone declarado ou derivado do tipo. */
  icon?: SemanticIcon;
  /** Unidade da métrica, aparada. */
  unit?: string;
  /** Peso do card na leitura da linha. */
  emphasis: BlockEmphasis;
}

/** String presente e não vazia (depois de aparada). */
function trimmed(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (text.length === 0) return undefined;
  // Corta em vez de rejeitar: uma unidade longa demais é um erro de escrita do
  // agente, e perder o card inteiro por causa dela seria desproporcional.
  return text.slice(0, maxLength);
}

function isEmphasis(value: unknown): value is BlockEmphasis {
  return value === 'default' || value === 'featured' || value === 'muted';
}

/**
 * Lê os campos de apresentação de um bloco. Aceita tanto o campo no PRÓPRIO
 * bloco quanto em `props` — a mesma prioridade que `explicitBlockText` já usa
 * no render-engine, porque o playground do catálogo grava em `props` enquanto
 * o backend grava no bloco.
 */
export function resolveBlockPresentation(block: Block | null | undefined): BlockPresentation {
  const raw = (block ?? {}) as Record<string, unknown>;
  const props = (raw.props ?? {}) as Record<string, unknown>;

  const declaredIcon = isSemanticIcon(raw.icon)
    ? raw.icon
    : isSemanticIcon(props.icon)
      ? props.icon
      : undefined;

  const emphasis = isEmphasis(raw.emphasis)
    ? raw.emphasis
    : isEmphasis(props.emphasis)
      ? props.emphasis
      : 'default';

  const icon =
    declaredIcon ?? iconForBlockType(typeof raw.type === 'string' ? raw.type : undefined);
  const unit = trimmed(raw.unit ?? props.unit, 24);

  return {
    ...(icon ? { icon } : {}),
    ...(unit ? { unit } : {}),
    emphasis,
  };
}

/** Composição já normalizada de uma linha — pronta para o grid. */
export interface RowLayout {
  /** Faixas declaradas (1..6) ou `undefined` = deixe o motor encaixar. */
  columns?: number;
  /** `equal` (padrão) ou `span`. */
  itemSizing: RowItemSizing;
}

export function resolveRowLayout(row: Row | null | undefined): RowLayout {
  const raw = (row ?? {}) as Record<string, unknown>;
  const columns =
    typeof raw.columns === 'number' && Number.isFinite(raw.columns)
      ? Math.max(1, Math.min(6, Math.round(raw.columns)))
      : undefined;
  return {
    ...(columns != null ? { columns } : {}),
    // `equal` é o padrão porque é a regra que impede o desequilíbrio
    // ACIDENTAL; `span` precisa ser pedido, e pedir é declarar intenção.
    itemSizing: raw.itemSizing === 'span' ? 'span' : 'equal',
  };
}

/** Preferência de aparência já normalizada. */
export interface ResolvedDashboardTheme {
  colorMode?: 'light' | 'dark' | 'system';
  accent?: string;
  palette?: 'single' | 'multi';
}

/**
 * Lê `layout.theme`. Devolve SEMPRE um objeto (possivelmente vazio) para o
 * chamador não precisar checar nulo antes de cada campo — o que, na prática, é
 * o tipo de checagem que se esquece em um dos três consumidores.
 */
export function resolveDashboardTheme(
  layout: DashboardLayout | null | undefined,
): ResolvedDashboardTheme {
  const theme = (layout?.theme ?? {}) as DashboardTheme;
  const colorMode =
    theme.colorMode === 'light' || theme.colorMode === 'dark' || theme.colorMode === 'system'
      ? theme.colorMode
      : undefined;
  const palette =
    theme.palette === 'single' || theme.palette === 'multi' ? theme.palette : undefined;
  return {
    ...(colorMode ? { colorMode } : {}),
    ...(trimmed(theme.accent, 40) ? { accent: trimmed(theme.accent, 40) } : {}),
    ...(palette ? { palette } : {}),
  };
}
