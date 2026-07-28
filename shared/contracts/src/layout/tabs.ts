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
import type { DashboardLayout, Row, Tab } from '../types';

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
  /**
   * `true` quando a aba não existe no JSON e foi sintetizada porque o layout é
   * legado (sem `tabs`). A UI usa isso para NÃO desenhar a navegação lateral
   * quando só existe a aba implícita — um dashboard sem abas não deve ganhar
   * uma barra de abas de uma aba só.
   */
  isImplicit: boolean;
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
  const resolved: ResolvedTab[] = tabs.map((tab, index) => {
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
