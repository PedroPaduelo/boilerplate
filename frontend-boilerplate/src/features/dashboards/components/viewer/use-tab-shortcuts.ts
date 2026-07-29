/**
 * Atalhos de teclado da tela de visualização.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ATALHOS AQUI
 * ---------------------------------------------------------------------------
 * Esta é uma tela de LEITURA REPETIDA: quem acompanha um painel volta a ele
 * todo dia e percorre as mesmas abas. Nesse uso, o mouse é o gargalo — e é
 * exatamente o caso em que atalho deixa de ser enfeite. Os três escolhidos
 * cobrem o que se faz mais de uma vez por visita:
 *
 *   `/`            foca a busca de abas (a convenção de busca da web inteira:
 *                  GitHub, Slack, Gmail — não há o que inventar aqui);
 *   `Alt + ↑ / ↓`  vai para a aba anterior/seguinte, na ordem que está na tela.
 *
 * `Alt` como modificador, e não a seta pura: seta sozinha é ROLAGEM, e roubar
 * a rolagem de uma página de gráficos altos seria trocar um atalho por uma
 * regressão. `Alt+seta` também não colide com voltar/avançar do navegador
 * (que é `Alt+←/→` no Windows e `⌘+[ ]` no macOS).
 *
 * ---------------------------------------------------------------------------
 * REGRA DE OURO: NÃO SEQUESTRAR DIGITAÇÃO
 * ---------------------------------------------------------------------------
 * Um atalho de tecla única precisa desligar dentro de campo de texto, senão
 * digitar "/" num filtro de data vira um salto de foco inexplicável. A guarda
 * cobre `input`, `textarea`, `select` e qualquer `contenteditable` — e também
 * qualquer combinação com Ctrl/Meta, que pertence ao navegador ou ao sistema
 * operacional, nunca à página.
 */
import { useEffect, type RefObject } from 'react';

export interface UseTabShortcutsOptions {
  /** `false` desliga tudo (ex.: dashboard sem navegação de abas). */
  isEnabled: boolean;
  /** Vai para a aba anterior/seguinte. */
  onNavigate: (direction: 'previous' | 'next') => void;
  /** Campo de busca das abas — só existe quando há abas o bastante. */
  filterInputRef?: RefObject<HTMLInputElement | null>;
}

/** O evento aconteceu dentro de um campo em que a pessoa está digitando? */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useTabShortcuts({
  isEnabled,
  onNavigate,
  filterInputRef,
}: UseTabShortcutsOptions): void {
  useEffect(() => {
    if (!isEnabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Combinações do sistema/navegador não são nossas.
      if (event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.altKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        onNavigate(event.key === 'ArrowDown' ? 'next' : 'previous');
        return;
      }

      if (event.key === '/' && !event.altKey && !event.shiftKey) {
        const input = filterInputRef?.current;
        if (!input) return;
        // `preventDefault` porque, sem ele, a própria barra "/" entraria no
        // campo que acabamos de focar.
        event.preventDefault();
        input.focus();
        input.select();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, onNavigate, filterInputRef]);
}
