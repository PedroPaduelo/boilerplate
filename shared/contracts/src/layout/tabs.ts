/**
 * Resolução de ABAS de um dashboard — função PURA, compartilhada BE/FE/MCP.
 *
 * É a ÚNICA fonte da verdade sobre "quais linhas aparecem em qual aba". Se cada
 * lado normalizasse por conta própria, o editor, a tela de visualização e o
 * backend discordariam sobre onde está uma linha — e o sintoma seria bloco
 * sumindo da tela, que é justamente o que não pode acontecer aqui.
 *
 * MODELO (doc 40): `tabs` é uma PROJEÇÃO sobre `rows` — a aba guarda os IDS das
 * linhas (`rowIds`), não as linhas. `rows` continua sendo a lista canônica e
 * completa, então todo consumidor que percorre `layout.rows` (resolução de
 * dados, validação de chartId, snapshot do publish, export de PDF, MCP, agente)
 * segue enxergando 100% dos blocos sem precisar conhecer abas.
 *
 * INVARIANTE QUE ESTE MÓDULO GARANTE:
 *   união das linhas de todas as abas resolvidas === `layout.rows`
 * ou seja: NENHUM bloco fica invisível, aconteça o que acontecer com o JSON.
 * Sem isso, um layout escrito pelo agente (que hoje não conhece abas) esconderia
 * conteúdo silenciosamente — sem erro, sem aviso, só um dashboard incompleto.
 */
import { TAB_ICONS, type DashboardLayout, type Row, type Tab, type TabIcon } from '../types';

/**
 * Id da aba sintética usada quando o layout não declara `tabs`. Começa com `__`
 * para não colidir com id gerado pelo editor/agente (que usam prefixo `tab_`).
 */
export const IMPLICIT_TAB_ID = '__default__';

/** Rótulo da aba implícita (layout legado, sem abas declaradas). */
export const IMPLICIT_TAB_TITLE = 'Visão geral';

/** Uma aba já resolvida: com as `rows` reais, prontas para render. */
export interface ResolvedTab {
  id: string;
  title: string;
  /** Linhas da aba, já materializadas e na ordem de exibição. */
  rows: Row[];
  /** Ícone semântico declarado no layout (ver `TAB_ICONS`), se houver. */
  icon?: TabIcon;
  /** Uma linha sobre o que a aba responde, se declarada. */
  description?: string;
  /** Grupo/seção da aba na navegação, se declarado. */
  group?: string;
  /** Posição declarada (menor primeiro). Ausente = ordem de declaração. */
  order?: number;
  /** `1` (padrão) aba de primeiro nível; `2` sub-aba (indentada, peso menor). */
  level?: 1 | 2;
  /** Desenha um separador ANTES desta aba na navegação. */
  divider?: boolean;
  /**
   * `true` quando a aba não existe no JSON e foi sintetizada porque o layout é
   * legado (sem `tabs`). A UI usa isso para NÃO desenhar a navegação lateral
   * quando só existe a aba implícita — um dashboard sem abas não deve ganhar
   * uma barra de abas de uma aba só.
   */
  isImplicit: boolean;
}

/** O valor é um dos ícones do vocabulário de abas? */
function isTabIcon(value: unknown): value is TabIcon {
  return typeof value === 'string' && (TAB_ICONS as readonly string[]).includes(value);
}

/** String presente e não vazia (depois de aparada). */
function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Inteiro de ordenação declarado, ou `undefined` (que significa "sem opinião"). */
function readOrder(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value)
    : undefined;
}

/**
 * Ordena as abas por `order`, com a ordem de DECLARAÇÃO como desempate.
 *
 * Duas decisões que parecem detalhe e não são:
 *
 *  - aba SEM `order` vale a PRÓPRIA POSIÇÃO, não zero. Um dashboard em que só
 *    a aba nova declara ordem continua legível: ela se encaixa, as outras não
 *    se mexem. Se a ausência valesse zero, escrever `order` numa única aba
 *    REORDENARIA todas as demais — o oposto do que quem escreveu o campo pediu.
 *  - no EMPATE, quem DECLAROU vence quem não declarou. Sem isso, o caso que
 *    justifica o campo não funcionaria: acrescentar uma aba ao fim de um
 *    dashboard pronto pedindo `order: 1` empataria com a aba que já ocupa a
 *    posição 1 e perderia por vir depois no array — ou seja, o campo seria
 *    aceito e ignorado, que é a pior combinação possível.
 *  - entre duas declarações iguais, a ordenação é ESTÁVEL (o índice entra como
 *    último desempate), então elas não trocam de lugar entre renders.
 */
function sortByOrder(tabs: readonly Tab[]): { tab: Tab; index: number }[] {
  const decorated = tabs.map((tab, index) => ({
    tab,
    index,
    order: readOrder(tab?.order),
  }));
  return decorated
    .slice()
    .sort((a, b) => {
      // `?? index` faz a aba sem opinião valer a própria posição — é isso que a
      // mantém parada quando outra declara ordem.
      const byOrder = (a.order ?? a.index) - (b.order ?? b.index);
      if (byOrder !== 0) return byOrder;
      // Empate: uma declaração explícita passa na frente de uma posição
      // herdada. Uma afirmação vale mais que uma inferência.
      const declared = Number(b.order != null) - Number(a.order != null);
      if (declared !== 0) return declared;
      return a.index - b.index;
    })
    .map(({ tab, index }) => ({ tab, index }));
}

/** `true` quando o layout declara abas de verdade (não a implícita). */
export function hasExplicitTabs(
  layout: Pick<DashboardLayout, 'tabs'> | null | undefined,
): boolean {
  return Array.isArray(layout?.tabs) && layout.tabs.length > 0;
}

/**
 * Resolve as abas de um layout em linhas materializadas.
 *
 * Regras de normalização (todas defensivas — o layout pode ter sido escrito
 * pelo agente, por uma versão anterior do editor ou à mão):
 *
 *  1. sem `tabs` (ou `tabs: []`)  → UMA aba implícita com TODAS as `rows`,
 *     na ordem original. É a retrocompatibilidade dos dashboards já salvos.
 *  2. `rowId` que não existe em `rows` → ignorado (não inventa linha fantasma).
 *  3. mesmo `rowId` em duas abas → a PRIMEIRA ocorrência vence (linha nunca
 *     é renderizada duas vezes — id de bloco duplicado quebraria o mapa de
 *     dados do batch, que é indexado por blockId).
 *  4. linha ÓRFÃ (existe em `rows`, não citada por nenhuma aba) → anexada ao
 *     FIM da PRIMEIRA aba. É esta regra que sustenta o invariante de que
 *     nenhum bloco some. Acontece de verdade quando o agente insere uma linha
 *     via `add_chart_to_dashboard` sem saber que o dashboard tem abas.
 */
export function resolveDashboardTabs(
  layout: DashboardLayout | null | undefined,
): ResolvedTab[] {
  const rows: Row[] = Array.isArray(layout?.rows) ? layout.rows : [];
  const tabs: Tab[] = Array.isArray(layout?.tabs) ? layout.tabs : [];

  // (1) layout legado: uma aba implícita com tudo.
  if (tabs.length === 0) {
    return [
      { id: IMPLICIT_TAB_ID, title: IMPLICIT_TAB_TITLE, rows, isImplicit: true },
    ];
  }

  const rowById = new Map<string, Row>();
  for (const row of rows) {
    // linha sem id utilizável não é endereçável por aba — ignorada aqui e
    // recuperada como órfã abaixo seria impossível, então cai fora do mapa.
    if (row && typeof row.id === 'string' && row.id.length > 0 && !rowById.has(row.id)) {
      rowById.set(row.id, row);
    }
  }

  const claimed = new Set<string>();
  // A ordem de EXIBIÇÃO sai daqui; o índice original continua sendo usado para
  // os rótulos de fallback ("Aba 3"), que devem refletir o que está escrito no
  // JSON e não a posição depois de reordenar.
  const resolved: ResolvedTab[] = sortByOrder(tabs).map(({ tab, index }) => {
    const ids = Array.isArray(tab?.rowIds) ? tab.rowIds : [];
    const tabRows: Row[] = [];
    for (const rowId of ids) {
      // (2) id desconhecido e (3) id já usado por outra aba.
      if (claimed.has(rowId)) continue;
      const row = rowById.get(rowId);
      if (!row) continue;
      claimed.add(rowId);
      tabRows.push(row);
    }
    return {
      id: typeof tab?.id === 'string' && tab.id.length > 0 ? tab.id : `tab_${index}`,
      title:
        typeof tab?.title === 'string' && tab.title.trim().length > 0
          ? tab.title
          : `Aba ${index + 1}`,
      rows: tabRows,
      isImplicit: false,
      // Campos de apresentação: normalizados aqui (e não na tela) para que
      // backend, viewer, editor e export leiam exatamente o mesmo valor.
      // Ícone fora do vocabulário é DESCARTADO em vez de propagado: melhor a
      // aba sair com marcador neutro do que a tela quebrar tentando desenhar
      // um nome que não existe.
      ...(isTabIcon(tab?.icon) ? { icon: tab.icon } : {}),
      ...(nonEmpty(tab?.description) ? { description: tab.description.trim() } : {}),
      ...(nonEmpty(tab?.group) ? { group: tab.group.trim() } : {}),
      ...(readOrder(tab?.order) != null ? { order: readOrder(tab?.order) } : {}),
      // Só `2` liga a sub-aba; qualquer outro valor (0, 7, "dois") cai no
      // nível 1, que é o padrão — hierarquia inventada é pior que hierarquia
      // ausente, porque desalinha a lista inteira sem o autor entender por quê.
      ...(tab?.level === 2 ? { level: 2 as const } : {}),
      ...(tab?.divider === true ? { divider: true } : {}),
    };
  });

  // (4) linhas órfãs → primeira aba, preservando a ordem de `rows`.
  const orphans = rows.filter(
    (row) => row && typeof row.id === 'string' && !claimed.has(row.id),
  );
  const first = resolved[0];
  if (orphans.length > 0 && first) {
    resolved[0] = { ...first, rows: [...first.rows, ...orphans] };
  }

  return resolved;
}

/**
 * Escolhe a aba ATIVA a partir de um id pedido (ex.: `?tab=` da URL).
 * Cai na primeira aba quando o id é inválido/ausente — assim um link antigo ou
 * uma aba removida abrem o dashboard em vez de uma tela vazia.
 */
export function pickActiveTab(
  tabs: ResolvedTab[],
  requestedId: string | null | undefined,
): ResolvedTab | undefined {
  if (tabs.length === 0) return undefined;
  if (requestedId) {
    const found = tabs.find((tab) => tab.id === requestedId);
    if (found) return found;
  }
  return tabs[0];
}

/**
 * Devolve um `DashboardLayout` contendo SOMENTE as linhas da aba indicada —
 * o objeto que vai para o `DashboardRenderer`.
 *
 * Existe para que a tela de visualização REUSE o renderer como ele é (ele é
 * orientado a `rows`), sem duplicar render nem precisar de mudança no
 * render-engine: trocar de aba é só trocar o `layout.rows` que ele recebe.
 * `tabs` sai do objeto devolvido de propósito — o renderer não deve nem saber
 * que abas existem.
 */
export function layoutForTab(
  layout: DashboardLayout | null | undefined,
  tab: ResolvedTab | undefined,
): DashboardLayout {
  return {
    filters: Array.isArray(layout?.filters) ? layout.filters : [],
    rows: tab ? tab.rows : [],
  };
}
