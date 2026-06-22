/**
 * Tela do Chat embutido (T-H) — `/chat`.
 *
 * Junta tudo: lista de mensagens (com streaming + render inline de gráfico),
 * input de envio e indicador de "pensando". A fonte das respostas vem do
 * {@link ChatTransport} INJETADO via `ChatTransportProvider` (default = mock).
 *
 * MOCKADO: a única coisa simulada é o transporte (respostas do agente). Tudo
 * mais — render inline (BlockRenderer), "adicionar ao dashboard" (API real),
 * RBAC — é o sistema real. A T-H2 troca o transport por um `HttpChatTransport`.
 */
import { Bot, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatTransportProvider } from '../transport';
import type { ChatTransport } from '../transport';
import { useChat } from '../use-chat';
import { ChatMessageList } from './chat-message-list';
import { ChatInput } from './chat-input';

/** Conteúdo do chat (assume um `ChatTransportProvider` acima). */
function ChatPageContent() {
  const { messages, isStreaming, error, send, stop, reset } = useChat();

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="size-4" />
          </span>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Agente de relatórios</h1>
            <p className="text-xs text-muted-foreground">
              Peça gráficos e relatórios em linguagem natural.
            </p>
          </div>
          <Badge variant="secondary" className="ml-1">
            Demo (mock)
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={messages.length === 0}
          aria-label="Limpar conversa"
        >
          <Trash2 className="size-4" />
          Limpar
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <ChatMessageList messages={messages} isStreaming={isStreaming} />
        {error ? (
          <div
            role="alert"
            className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}
      </div>

      <ChatInput onSend={send} onStop={stop} isStreaming={isStreaming} />
    </div>
  );
}

export interface ChatPageProps {
  /**
   * Permite injetar um transport (testes / T-H2). Em produção fica `undefined`
   * e o provider usa o `MockChatTransport` default.
   */
  transport?: ChatTransport;
}

export function ChatPage({ transport }: ChatPageProps) {
  return (
    <ChatTransportProvider transport={transport}>
      <ChatPageContent />
    </ChatTransportProvider>
  );
}
