/**
 * Tela do Chat — /chat
 *
 * Layout: sidebar | (header fixo + scroll de mensagens + input embaixo)
 * O agente usa HttpChatTransport (POST /agent/chat/:conversationId via SSE)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, MessageSquare, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { agentApi, type Conversation, type ChatMessageRecord } from '../api';
import { HttpChatTransport } from '../transport/http-transport';
import type { ChatMessage, ChatRole } from '../transport';
import { ChatMessageList } from './chat-message-list';
import { ChatInput } from './chat-input';
import { ThinkingBubble } from './thinking-indicator';
import { ToolStepsList } from './tool-steps-list';

function dbMessageToUi(m: ChatMessageRecord): ChatMessage {
  return {
    id: m.id,
    role: (m.role === 'user' ? 'user' : 'assistant') as ChatRole,
    content: m.content,
    createdAt: m.createdAt,
  };
}

function ChatArea({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolSteps, setToolSteps] = useState<
    Array<{ toolName: string; phase: 'call' | 'result'; args?: unknown; output?: unknown }>
  >([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    agentApi.getConversation(conversationId).then((conv) => {
      if (cancelled) return;
      const uiMsgs = (conv.messages ?? []).map(dbMessageToUi as any) as ChatMessage[];
      setMessages(uiMsgs);
      setToolSteps([]);
      setError(null);
    }).catch(() => {
      if (!cancelled) setMessages([]);
    });
    return () => { cancelled = true; };
  }, [conversationId]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setError(null);
    setToolSteps([]);

    const controller = new AbortController();
    abortRef.current = controller;
    const transport = new HttpChatTransport({ conversationId });

    try {
      for await (const ev of transport.sendMessage([...messages, userMsg], {
        signal: controller.signal,
      })) {
        switch (ev.type) {
          case 'message_start':
            setMessages((prev) => [
              ...prev,
              { id: ev.messageId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
            ]);
            break;
          case 'text_delta':
            setMessages((prev) =>
              prev.map((m) =>
                m.id === ev.messageId ? { ...m, content: m.content + ev.delta } : m,
              ),
            );
            break;
          case 'chart':
            setMessages((prev) =>
              prev.map((m) => (m.id === ev.messageId ? { ...m, chart: ev.chart } : m)),
            );
            break;
          case 'tool_step':
            setToolSteps((prev) => [
              ...prev,
              { toolName: ev.toolName, phase: ev.phase, args: ev.args, output: ev.output },
            ]);
            break;
          case 'error':
            setError(ev.message);
            break;
          case 'message_end':
          case 'usage':
            break;
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Falha ao falar com o agente.');
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsStreaming(false);
    }
  }, [conversationId, messages, isStreaming]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  // Detecta se tem mensagem do assistant vazia (ainda pensando)
  const lastMsg = messages[messages.length - 1];
  const isThinking = isStreaming && lastMsg?.role === 'assistant' && lastMsg.content.length === 0 && !lastMsg.chart;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Área de scroll (mensagens) — flex-1 + overflow + min-h-0 = scroll independente */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        <ChatMessageList messages={messages} isStreaming={isStreaming} />

        {/* Tool steps em tempo real (dentro do scroll) */}
        {toolSteps.length > 0 && isStreaming ? (
          <ToolStepsList steps={toolSteps} />
        ) : null}

        {/* Bolha de pensamento quando assistant não tem texto ainda */}
        {isThinking ? <ThinkingBubble toolSteps={toolSteps} /> : null}

        {error ? (
          <div role="alert" className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      {/* Input fixo embaixo */}
      <ChatInput onSend={send} onStop={stop} isStreaming={isStreaming} />
    </div>
  );
}

function ChatSidebar({
  conversations, activeId, onSelect, onCreate, onDelete,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex w-64 shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="p-3">
        <Button onClick={onCreate} size="sm" className="w-full">
          <Plus className="size-4" />
          Nova conversa
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">Nenhuma conversa ainda.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                  conv.id === activeId ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground',
                )}
                onClick={() => onSelect(conv.id)}
              >
                <MessageSquare className="size-3.5 shrink-0 opacity-50" />
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                  aria-label="Deletar conversa"
                >
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [agentReady, setAgentReady] = useState<boolean | null>(null);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await agentApi.listConversations();
      setConversations(list);
      if (list.length > 0 && !activeId) setActiveId(list[0].id);
    } catch { /* ignore */ }
  }, [activeId]);

  useEffect(() => {
    refreshConversations();
    agentApi.checkHealth().then((h) => setAgentReady(h.configured)).catch(() => setAgentReady(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = useCallback(async () => {
    const conv = await agentApi.createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await agentApi.deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-xl border border-border bg-card">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={handleCreate}
        onDelete={handleDelete}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {activeId ? (
          <>
            {/* Header fixo no topo */}
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="size-4" />
                </span>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">
                    {conversations.find((c) => c.id === activeId)?.title ?? 'Chat'}
                  </h1>
                  <p className="text-xs text-muted-foreground">Agente de IA com acesso aos seus dados</p>
                </div>
              </div>
              {agentReady === false ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="size-3" />
                  ANTHROPIC_API_KEY não configurada
                </Badge>
              ) : agentReady === true ? (
                <Badge variant="secondary">Agente ativo</Badge>
              ) : null}
            </header>
            {/* Área de chat (scroll + input) */}
            <ChatArea conversationId={activeId} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-muted-foreground">
            <Bot className="size-12 opacity-40" />
            <div>
              <p className="text-sm font-medium">Selecione ou crie uma conversa</p>
              <p className="text-xs">O agente de IA tem acesso aos seus dados e ferramentas.</p>
            </div>
            <Button onClick={handleCreate} size="sm">
              <Plus className="size-4" />
              Nova conversa
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
