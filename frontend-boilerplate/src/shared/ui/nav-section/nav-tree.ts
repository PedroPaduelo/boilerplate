/**
 * Leitura da árvore de itens — funções puras, sem React.
 *
 * Moram fora dos componentes porque são a REGRA que decide o estado inicial de
 * cada ramo (`vertical/nav-list.tsx:30-41` na origem), e regra que decide
 * abertura merece ser lida e testada sem montar DOM.
 */
import type { NavItemData } from './types';

/**
 * Chave estável do item.
 *
 * `href` antes de `title` porque o endereço é único no menu e o rótulo não é
 * (duas seções podem ter "Visão geral"). `key` explícito ganha de ambos, para
 * o caso de itens sem href e sem rótulo único.
 */
export function navItemKey(item: NavItemData): string {
  return item.key ?? item.href ?? item.title;
}

/**
 * Algum descendente — em qualquer profundidade — é a rota atual?
 *
 * É o que faz o pai NASCER aberto: sem isso, quem chega numa sub-rota por link
 * direto vê o menu fechado e não descobre onde está. Repare que o próprio item
 * não conta: pai ativo é `active`, não `open` (§3 do contrato — `open` ≠
 * `active`, e a diferença é a cor).
 */
export function hasActiveDescendant(item: NavItemData): boolean {
  return (item.children ?? []).some(
    (child) => child.active === true || hasActiveDescendant(child),
  );
}
