import { Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * Gatilho visível da paleta de comandos.
 *
 * Existe por descoberta: um atalho que ninguém vê não é usado. Mostrar o
 * "⌘K" na topbar ensina o atalho de forma passiva — o usuário clica algumas
 * vezes, memoriza a tecla e passa a usar o teclado (padrão Linear/Vercel).
 *
 * Não abre a paleta diretamente: dispara o MESMO evento de teclado que o
 * listener global escuta, mantendo uma única fonte de verdade para a abertura.
 */
export function CommandTrigger({ className }: { className?: string }) {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  function open() {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Abrir busca e comandos"
      className={cn(
        'group flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 py-1.5 pl-2.5 pr-1.5',
        'text-sm text-muted-foreground transition-colors',
        'hover:border-border hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Search className="size-4 shrink-0" />
      <span className="hidden min-w-[7rem] text-left sm:block">Buscar…</span>
      <kbd
        className={cn(
          'hidden shrink-0 items-center gap-0.5 rounded border border-border/70 bg-background px-1.5 py-0.5',
          'font-mono text-[10px] leading-none text-muted-foreground sm:flex',
        )}
      >
        {isMac ? '⌘' : 'Ctrl'} K
      </kbd>
    </button>
  );
}
