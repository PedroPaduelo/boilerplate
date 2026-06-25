/**
 * Tela do Chat — /chat
 *
 * Layout: sidebar | (header fixo + scroll de mensagens + input embaixo)
 * O agente usa HttpChatTransport (POST /agent/chat/:conversationId via SSE)
 *
 * Mudanças (2026-06-25):
 *  - Wrapper usa `h-[calc(100vh-7.5rem)]` (100vh - 56 topbar - 64 py-8 = 778px
 *    exatos pra caber no main em viewport lg).
 *  - Tool steps renderizam ACIMA da última mensagem do assistant em streaming
 *    (entre o histórico e a bolha atual). Scroll auto aponta pro fim da
 *    sequência renderizada (última assistant ou ThinkingBubble).
 *  - ToolStep agora tem `toolCallId` como chave; ao chegar `phase: 'result'`
 *    o step é marcado `fadingOut` e removido após 600ms (em vez de ficar com
 *    check verde persistente).
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
import { ChatMessageBubble } from './chat-message-bubble';
import { ChatInput } from './chat-input';
import { ThinkingBubble } from './thinking-indicator';
import { ToolStepsList, type ToolStep } from './tool-steps-list';

/** Tempo de fade-out antes de remover um tool step concluído. */
const TOOL_STEP_FADE_OUT_MS = 600;

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
  // toolSteps keyed por toolCallId (dedup por chave natural; manter array
  // ordenado dos mais recentes primeiro para render).
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const fadeOutTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Ref do fim do scroll — alvo do auto-scroll. Aponta pro final da lista
  // renderizada (última assistant OU ThinkingBubble), não dentro de
  // ChatMessageList (que agora só recebe mensagens históricas).
  const endOfScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    agentApi.getConversation(conversationId).then((conv) => {
      if (cancelled) return;
      const uiMsgs = (conv.messages ?? []).map(dbMessageToUi as any) as ChatMessage[];
      setMessages(uiMsgs);
      // Limpa timers pendentes e steps ao trocar de conversa
      fadeOutTimersRef.current.forEach((t) => clearTimeout(t));
      fadeOutTimersRef.current.clear();
      setToolSteps([]);
      setError(null);
    }).catch(() => {
      if (!cancelled) setMessages([]);
    });
    return () => { cancelled = true; };
  }, [conversationId]);

  // Limpa timers pendentes ao desmontar
  useEffect(() => {
    const timers = fadeOutTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

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
    // Cancela timers pendentes e zera steps ao começar nova mensagem
    fadeOutTimersRef.current.forEach((t) => clearTimeout(t));
    fadeOutTimersRef.current.clear();
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
          case 'tool_step': {
            // Dedup por toolCallId (mesmo call → mesmo step; result atualiza)
            const toolCallId = (ev as { toolCallId: string }).toolCallId;
            setToolSteps((prev) => {
              const idx = prev.findIndex((s) => s.toolCallId === toolCallId);
              if (idx === -1) {
                // Novo step → insere no INÍCIO (mais recente primeiro)
                return [
                  {
                    toolCallId,
                    toolName: ev.toolName,
                    phase: ev.phase,
                    args: ev.args,
                    output: ev.output,
                  },
                  ...prev,
                ];
              }
              // Já existe → atualiza in-place (pode ser um `call` repetido ou um `result`)
              const next = prev.slice();
              next[idx] = {
                toolCallId,
                toolName: ev.toolName,
                phase: ev.phase,
                args: ev.args,
                output: ev.output,
                fadingOut: prev[idx].fadingOut, // preserva fadingOut se já estava
              };
              return next;
            });

            if (ev.phase === 'result') {
              // Marca fadingOut + agenda remoção
              setToolSteps((prev) => {
                const idx = prev.findIndex((s) => s.toolCallId === toolCallId);
                if (idx === -1) return prev;
                const next = prev.slice();
                next[idx] = { ...next[idx], phase: 'result', fadingOut: true };
                return next;
              });
              // Cancela timer anterior (se houver)
              const existing = fadeOutTimersRef.current.get(toolCallId);
              if (existing) clearTimeout(existing);
              const timer = setTimeout(() => {
                setToolSteps((prev) => prev.filter((s) => s.toolCallId !== toolCallId));
                fadeOutTimersRef.current.delete(toolCallId);
              }, TOOL_STEP_FADE_OUT_MS);
              fadeOutTimersRef.current.set(toolCallId, timer);
            } else {
              // `call` chegou (de novo): cancela qualquer timer pendente de remoção
              const existing = fadeOutTimersRef.current.get(toolCallId);
              if (existing) {
                clearTimeout(existing);
                fadeOutTimersRef.current.delete(toolCallId);
              }
              // Garante fadingOut=false no call
              setToolSteps((prev) => {
                const idx = prev.findIndex((s) => s.toolCallId === toolCallId);
                if (idx === -1) return prev;
                const next = prev.slice();
                next[idx] = { ...next[idx], fadingOut: false };
                return next;
              });
            }
            break;
          }
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

  // Auto-scroll: sempre que mudar messages / toolSteps / streaming, leva
  // o fim da lista renderizada pra viewport.
  useEffect(() => {
    if (typeof endOfScrollRef.current?.scrollIntoView === 'function') {
      endOfScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, toolSteps, isStreaming]);

  // ---- Estrutura de render: separar histórico da última assistant em streaming ----
  // Se a última msg é do assistant e estamos em streaming, ela vira `currentAssistantMsg`
  // e renderiza SEPARADA, com ToolStepsList e ThinkingBubble em volta.
  const lastMsg = messages[messages.length - 1];
  const isLastAssistantStreaming = isStreaming && lastMsg?.role === 'assistant';

  // Detecta se tem mensagem do assistant vazia (ainda pensando)
  const isThinking =
    isStreaming &&
    lastMsg?.role === 'assistant' &&
    lastMsg.content.length === 0 &&
    !lastMsg.chart;

  // Passa ao ChatMessageList só o que NÃO é a última assistant em streaming
  const pastMessages = isLastAssistantStreaming ? messages.slice(0, -1) : messages;
  // Mostra tool steps visíveis durante o streaming (e mesmo no fade-out após result)
  const hasToolSteps = isStreaming && toolSteps.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Área de scroll (mensagens) — flex-1 + overflow + min-h-0 = scroll independente */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        <ChatMessageList messages={pastMessages} isStreaming={false} />

        {/* Tool steps ACIMA da última mensagem do assistant em streaming */}
        {hasToolSteps ? <ToolStepsList steps={toolSteps} /> : null}

        {/* Última mensagem do assistant em streaming (renderizada fora do list) */}
        {isLastAssistantStreaming ? (
          <ChatMessageBubbleStandalone
            message={lastMsg}
            streaming
            fadeIn={!isThinking}
          />
        ) : null}

        {/* Bolha de pensamento quando assistant não tem texto ainda */}
        {isThinking ? <ThinkingBubble toolSteps={toolSteps} /> : null}

        {error ? (
          <div role="alert" className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {/* Âncora do auto-scroll (sempre no final da sequência renderizada) */}
        <div ref={endOfScrollRef} />
      </div>

      {/* Input fixo embaixo */}
      <ChatInput onSend={send} onStop={stop} isStreaming={isStreaming} />
    </div>
  );
}

/**
 * Render standalone de uma bolha (usada para a ÚLTIMA mensagem do assistant
 * em streaming, fora do ChatMessageList para que ToolStepsList possa aparecer
 * entre o histórico e essa bolha).
 */
function ChatMessageBubbleStandalone({
  message,
  streaming,
  fadeIn,
}: {
  message: ChatMessage;
  streaming: boolean;
  fadeIn: boolean;
}) {
  return (
    <div
      data-slot="chat-current-assistant"
      className={cn(fadeIn && 'animate-in fade-in slide-in-from-bottom-2 duration-300')}
    >
      <ChatMessageBubble message={message} streaming={streaming} />
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
    /* calc(100vh - 7.5rem) = 100vh - 56px (topbar h-14) - 64px (py-8 do <main> interno).
       Valor escolhido pra caber EXATAMENTE na área visível do <main>: o wrapper
       anterior (h-[calc(100vh-7rem)] = 112px) deixava 8px de sobra que viravam
       scroll global do <main>. h-full sem pai com altura fixa estourava ainda
       mais (crescia com o conteúdo). */
    <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden rounded-xl border border-border bg-card">
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