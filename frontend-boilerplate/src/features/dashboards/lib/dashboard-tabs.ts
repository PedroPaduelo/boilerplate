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
