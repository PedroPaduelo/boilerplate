/**
 * Adaptador de ABAS para o front (doc 40).
 *
 * A REGRA de "que linha está em que aba" NÃO mora aqui: mora em
 * `@dashboards/contracts` (`resolveDashboardTabs`), que é a mesma função usada
 * pelo backend. Este arquivo só faz a ponte de tipos — os tipos do contrato
 * degradam para `any` no FE (o `json-schema-to-ts` não é dependência daqui, ver
 * a nota em `dashboard-filters.ts`), então reafirmamos localmente a forma que
 * consumimos e mantemos o resto do app com tipagem de verdade.
 *
 * Por que reusar em vez de reimplementar: um normalizador duplicado é como a
 * tela e o banco passam a discordar sobre onde está uma linha — e o sintoma
 * seria bloco sumindo da visualização, exatamente o que este desenho promete
 * que não acontece.
 */
import {
  layoutForTab as layoutForTabContract,
  pickActiveTab as pickActiveTabContract,
  resolveDashboardTabs as resolveDashboardTabsContract,
} from '@dashboards/contracts';
import type { DashboardLayout } from '@dashboards/contracts';

/** Linha do layout (subset tipado localmente, fiel ao contrato). */
export interface TabRow {
  id: string;
  title?: string;
  blocks: unknown[];
}

/** Uma aba já resolvida, com as linhas materializadas. */
export interface ResolvedDashTab {
  id: string;
  title: string;
  rows: TabRow[];
  /** `true` na aba sintética de um layout legado (sem `tabs` declaradas). */
  isImplicit: boolean;
  /**
   * Apresentação declarada no layout (ver `Tab` no contrato). Os três são
   * OPCIONAIS: dashboard antigo não tem nenhum e a tela degrada sozinha.
   */
  icon?: string;
  description?: string;
  group?: string;
  /** Posição declarada. A ordenação já vem aplicada pelo contrato. */
  order?: number;
  /** `2` = sub-aba (indentada, peso menor). Ausente = primeiro nível. */
  level?: 1 | 2;
  /** Desenha um separador ANTES deste item. */
  divider?: boolean;
}

/**
 * Abas agrupadas por `group`, preservando a ordem de declaração — tanto dos
 * grupos (ordem da primeira aba de cada um) quanto das abas dentro do grupo.
 *
 * Existe para a navegação lateral virar SEÇÕES quando o dashboard tem muitas
 * abas. Uma lista plana de 12 abas obriga o leitor a ler as 12 para achar a
 * sua; agrupadas em "Arrecadação / Fiscalização / Cadastro", ele descarta dois
 * terços de imediato. Abas sem grupo ficam juntas numa seção sem título — não
 * inventamos um rótulo ("Outros") que o autor não escreveu.
 */
export interface TabGroup {
  /** `undefined` na seção das abas sem grupo declarado. */
  title?: string;
  tabs: ResolvedDashTab[];
}

/**
 * Uma aba de primeiro nível com as suas SUB-ABAS (as de `level: 2` que vêm
 * logo depois dela).
 */
export interface NestedTab {
  tab: ResolvedDashTab;
  children: ResolvedDashTab[];
}

/**
 * Converte a lista PLANA (que é como o contrato guarda) na árvore de dois
 * níveis que a navegação desenha.
 *
 * O contrato guarda plano de propósito — `level` é uma anotação, não um
 * aninhamento —, porque uma estrutura aninhada no JSON obrigaria o agente a
 * acertar a árvore inteira de uma vez e tornaria "promover uma sub-aba" uma
 * reescrita. Aqui a árvore é derivada: sub-aba pertence à aba de primeiro
 * nível imediatamente anterior.
 *
 * Sub-aba SEM pai (primeira da lista, ou depois de um filtro que escondeu o
 * pai) vira item de primeiro nível em vez de sumir: perder uma aba é sempre
 * pior que mostrá-la um nível acima do pretendido.
 */
export function nestTabs(tabs: ResolvedDashTab[]): NestedTab[] {
  const nested: NestedTab[] = [];
  for (const tab of tabs) {
    const parent = nested[nested.length - 1];
    if (tab.level === 2 && parent) {
      parent.children.push(tab);
      continue;
    }
    nested.push({ tab, children: [] });
  }
  return nested;
}

export function groupTabs(tabs: ResolvedDashTab[]): TabGroup[] {
  const groups: TabGroup[] = [];
  const byTitle = new Map<string, TabGroup>();

  for (const tab of tabs) {
    const key = tab.group?.trim();
    if (!key) {
      // Abas soltas entram numa seção sem título, na posição em que aparecem.
      const last = groups[groups.length - 1];
      if (last && last.title === undefined) {
        last.tabs.push(tab);
      } else {
        groups.push({ tabs: [tab] });
      }
      continue;
    }
    const existing = byTitle.get(key);
    if (existing) {
      existing.tabs.push(tab);
      continue;
    }
    const created: TabGroup = { title: key, tabs: [tab] };
    byTitle.set(key, created);
    groups.push(created);
  }

  return groups;
}

/**
 * Resolve as abas de um layout. Layout legado (sem `tabs`) devolve UMA aba
 * implícita com todas as linhas — é o que preserva o comportamento atual das
 * telas para os dashboards que já existem.
 */
export function resolveTabs(layout: unknown): ResolvedDashTab[] {
  return resolveDashboardTabsContract(layout as DashboardLayout) as ResolvedDashTab[];
}

/** Aba ativa a partir do id pedido (`?tab=`), com fallback na primeira. */
export function pickTab(
  tabs: ResolvedDashTab[],
  requestedId: string | null | undefined,
): ResolvedDashTab | undefined {
  return pickActiveTabContract(tabs as never, requestedId) as ResolvedDashTab | undefined;
}

/**
 * Layout contendo SÓ as linhas da aba — é o objeto entregue ao
 * `DashboardRenderer`. Trocar de aba é trocar este objeto: o render-engine
 * segue sendo consumido exatamente como está, sem saber que abas existem.
 */
export function layoutOfTab(
  layout: unknown,
  tab: ResolvedDashTab | undefined,
): DashboardLayout {
  return layoutForTabContract(layout as DashboardLayout, tab as never);
}

/**
 * `true` quando vale desenhar a navegação de abas. Um dashboard com uma única
 * aba (ou legado) não ganha barra lateral: uma "navegação" de um item só é
 * ruído, e o leitor de tela anunciaria uma região de navegação inútil.
 */
export function shouldShowTabNav(tabs: ResolvedDashTab[]): boolean {
  return tabs.length > 1;
}

/**
 * A partir de quantas abas a navegação ganha campo de BUSCA.
 *
 * Oito é onde a lista deixa de caber num relance: até aí o olho varre mais
 * rápido do que a mão digita, e um campo de busca permanente seria um controle
 * a mais competindo com os itens. Acima disso a varredura vira leitura, e é
 * quando filtrar passa a ser mais barato que procurar.
 */
export const TAB_FILTER_THRESHOLD = 8;

/**
 * Filtra abas por texto livre, casando TÍTULO, DESCRIÇÃO e GRUPO.
 *
 * Casar os três (e não só o título) é o que faz a busca responder à pergunta
 * real de quem procura: a pessoa lembra do ASSUNTO ("bairro", "protesto"), não
 * do rótulo exato que o agente escolheu. Comparação sem acento e sem caixa
 * porque ninguém digita "Fiscalização" com cedilha e til num campo de busca.
 */
export function filterTabs(tabs: ResolvedDashTab[], term: string): ResolvedDashTab[] {
  const needle = normalizeForSearch(term);
  if (needle.length === 0) return tabs;
  return tabs.filter((tab) => {
    const haystack = normalizeForSearch(
      [tab.title, tab.description, tab.group].filter(Boolean).join(' '),
    );
    return haystack.includes(needle);
  });
}

/** Minúsculas, sem acento e sem espaço nas pontas — para comparar como gente. */
function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Vizinha de uma aba na direção pedida, para o atalho de teclado.
 *
 * Sem "dar a volta" (não vai da última para a primeira) de propósito: numa
 * navegação por atalho repetido, o ciclo faz a pessoa passar do fim para o
 * começo sem perceber e reler o que já viu. Parar na borda é o comportamento
 * de qualquer lista de sistema.
 */
export function neighborTabId(
  tabs: ResolvedDashTab[],
  activeId: string,
  direction: 'previous' | 'next',
): string | undefined {
  const index = tabs.findIndex((tab) => tab.id === activeId);
  if (index < 0) return undefined;
  const target = direction === 'next' ? index + 1 : index - 1;
  return tabs[target]?.id;
}
