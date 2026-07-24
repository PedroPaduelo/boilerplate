/**
 * Composer do chat.
 *
 * Antes: um textarea "solto" com um botão "Enviar" ao lado, ambos dentro de
 * uma barra. Parecia um formulário genérico. Agora o campo e as ações vivem
 * DENTRO de um mesmo container arredondado que reage ao foco — o padrão de
 * composer consagrado (ChatGPT, Claude, Linear): o input é o elemento
 * principal da tela e precisa parecer um lugar convidativo para escrever.
 *
 * Detalhes que fazem diferença:
 *  - auto-resize até um teto (a caixa cresce com o texto, sem scroll precoce);
 *  - o anel de foco fica no CONTAINER, não no textarea, para o conjunto ler
 *    como um só controle;
 *  - dica de teclado discreta, some no mobile onde não faz sentido.
 */
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';

export interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

/** Altura máxima do composer antes de virar área rolável (~8 linhas). */
const MAX_HEIGHT_PX = 200;

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize: zera a altura e reaplica pelo scrollHeight, limitado ao teto.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled && !isStreaming;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div data-slot="chat-input" className="shrink-0 px-3 pb-3 pt-1">
      <div
        className={cn(
          'flex items-end gap-2 rounded-2xl border border-border bg-card p-2 pl-3.5',
          'shadow-sm transition-[border-color,box-shadow] duration-200',
          'focus-within:border-primary/50',
          'focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_12%,transparent)]',
        )}
      >
        <textarea
          ref={textareaRef}
          aria-label="Mensagem"
          placeholder="Pergunte sobre seus dados…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none self-center bg-transparent py-2 text-sm leading-relaxed',
            'outline-none placeholder:text-muted-foreground disabled:opacity-50',
          )}
        />

        {isStreaming ? (
          <Button
            variant="outline"
            size="icon"
            onClick={onStop}
            aria-label="Parar resposta"
            className="shrink-0 rounded-xl"
          >
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            onClick={submit}
            disabled={!canSend}
            aria-label="Enviar"
            size="icon"
            className={cn(
              'shrink-0 rounded-xl transition-transform',
              canSend ? 'scale-100' : 'scale-95',
            )}
          >
            <ArrowUp className="size-4" />
          </Button>
        )}
      </div>

      <p className="mt-1.5 hidden px-1 text-[11px] text-muted-foreground sm:block">
        <kbd className="font-mono">Enter</kbd> envia ·{' '}
        <kbd className="font-mono">Shift+Enter</kbd> quebra linha
      </p>
    </div>
  );
}
