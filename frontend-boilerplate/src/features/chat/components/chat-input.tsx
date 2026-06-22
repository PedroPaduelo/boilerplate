/** Barra de input do chat: textarea + enviar (Enter envia, Shift+Enter quebra). */
import { useState, type KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/features/dashboards/components/editor/textarea';

export interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  const submit = () => {
    const text = value.trim();
    if (!text || isStreaming || disabled) return;
    onSend(text);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div data-slot="chat-input" className="flex items-end gap-2 border-t border-border p-3">
      <Textarea
        aria-label="Mensagem"
        placeholder="Pergunte ao agente… (Enter envia, Shift+Enter quebra linha)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="max-h-40 min-h-11 flex-1 resize-none"
        rows={1}
      />
      {/* "Parar" é um botão SEPARADO (não substitui o "Enviar" no mesmo lugar),
          evitando que um clique residual no alvo do "Enviar" caia no "Parar". */}
      {isStreaming ? (
        <Button variant="outline" onClick={onStop} aria-label="Parar resposta">
          <Square className="size-4" />
          Parar
        </Button>
      ) : null}
      <Button
        onClick={submit}
        disabled={!value.trim() || disabled || isStreaming}
        aria-label="Enviar"
      >
        <Send className="size-4" />
        Enviar
      </Button>
    </div>
  );
}
