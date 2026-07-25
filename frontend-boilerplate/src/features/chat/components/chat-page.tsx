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
import {
  Bot,
  MessageSquare,
  Plus,
  Trash2,
  AlertCircle,
  BarChart3,
  Database,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
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

/**
 * Sugestões de partida para uma conversa vazia.
 *
 * Interface conversacional sofre do "blank slate": a caixa de texto aceita
 * qualquer coisa, então o usuário não sabe o que a ferramenta consegue fazer e
 * trava. As sugestões abaixo demonstram as QUATRO capacidades do agente
 * (explorar schema, agregar, visualizar e auditar integridade) já no tom de
 * auditoria do produto.
 */
const SUGGESTED_PROMPTS = [
  {
    icon: Database,
    title: 'Entender os dados',
    prompt: 'Quais tabelas existem na minha conexão e o que cada uma representa?',
  },
  {
    icon: TrendingUp,
    title: 'Achar anomalias',
    prompt:
      'Quais lançamentos fogem do padrão nos últimos 90 dias? Traga os 10 maiores desvios.',
  },
  {
    icon: BarChart3,
    title: 'Gerar um gráfico',
    prompt: 'Monte um gráfico de barras com o total por mês no último ano.',
  },
  {
    icon: ShieldCheck,
    title: 'Checar integridade',
    prompt:
      'Existem registros duplicados ou com campos obrigatórios vazios? Mostre a contagem por tabela.',
  },
] as const;

/** Boas-vindas + sugestões clicáveis, exibidas quando a conversa está vazia. */
function ChatEmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bot className="size-6" />
        </span>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">
            O que você quer investigar hoje?
          </p>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            Pergunte em português. O agente consulta suas conexões, escreve o SQL e
            devolve a resposta — com o gráfico pronto para salvar.
          </p>
        </div>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map(({ icon: Icon, title, prompt }) => (
          <button
            key={title}
            type="button"
            onClick={() => onPick(prompt)}
            className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="size-4" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">{title}</span>
              <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                {prompt}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

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
  /** Última pergunta enviada — permite reenviar após uma falha do agente. */
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);
  const fadeOutTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Ref do fim do scroll — alvo do auto-scroll. Aponta pro final da lista
  // renderizada (última assistant OU ThinkingBubble), não dentro de
  // ChatMessageList (que agora só recebe mensagens históricas).
  const endOfScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    agentApi
      .getConversation(conversationId)
      .then((conv) => {
        if (cancelled) return;
        setMessages((conv.messages ?? []).map(dbMessageToUi));
        // Limpa timers pendentes e steps ao trocar de conversa
        fadeOutTimersRef.current.forEach((t) => clearTimeout(t));
        fadeOutTimersRef.current.clear();
        setToolSteps([]);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Limpa timers pendentes ao desmontar
  useEffect(() => {
    const timers = fadeOutTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const send = useCallback(
    async (text: string) => {
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
      setLastPrompt(trimmed);
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
                {
                  id: ev.messageId,
                  role: 'assistant',
                  content: '',
                  createdAt: new Date().toISOString(),
                },
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
    },
    [conversationId, messages, isStreaming],
  );

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
        {/* Conversa ainda sem mensagens → sugestões de partida. Clicar já
            dispara o envio (um clique em vez de "preencher e depois enviar"). */}
        {messages.length === 0 && !isStreaming ? <ChatEmptyState onPick={send} /> : null}

        <ChatMessageList messages={pastMessages} isStreaming={false} />

        {/* Tool steps ACIMA da última mensagem do assistant em streaming */}
        {hasToolSteps ? <ToolStepsList steps={toolSteps} /> : null}

        {/* Última mensagem do assistant em streaming (renderizada fora do list) */}
        {isLastAssistantStreaming ? (
          <ChatMessageBubbleStandalone message={lastMsg} streaming fadeIn={!isThinking} />
        ) : null}

        {/* Bolha de pensamento quando assistant não tem texto ainda */}
        {isThinking ? <ThinkingBubble toolSteps={toolSteps} /> : null}

        {/* Falha do agente em linguagem de gente. O texto cru do provider
            (ex.: "Invalid JSON response") não diz NADA ao usuário e ainda
            sugere que a culpa é dele; fica preservado como detalhe técnico
            para depuração, atrás de um disclosure. */}
        {error ? (
          <div
            role="alert"
            className="mt-3 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-destructive">
                  Não consegui concluir essa resposta
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  A conversa com o agente foi interrompida. Sua pergunta continua aqui —
                  pode tentar de novo.
                </p>
              </div>
              {lastPrompt ? (
                <div>
                  <Button size="sm" variant="outline" onClick={() => send(lastPrompt)}>
                    Tentar de novo
                  </Button>
                </div>
              ) : null}
              <details className="group">
                <summary className="cursor-pointer list-none text-[11px] text-muted-foreground transition hover:text-foreground">
                  Detalhes técnicos
                </summary>
                <p className="mt-1 break-words font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {error}
                </p>
              </details>
            </div>
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

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

/**
 * Lista de conversas.
 *
 * Some no mobile: com 256px fixos ela ocupava 66% de uma tela de 390px e
 * espremia o chat a ponto do campo de digitar ficar com 8px de largura. No
 * celular ela vira drawer, acionada pelo botão de conversas no cabeçalho —
 * mesmo padrão (`Sheet`) que a navegação principal já usa.
 */
function ChatSidebar(props: ChatSidebarProps) {
  return (
    <div className="hidden w-64 shrink-0 flex-col border-r border-border bg-muted/30 md:flex">
      <ChatSidebarContent {...props} />
    </div>
  );
}

function ChatSidebarContent({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: ChatSidebarProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-3">
        <Button onClick={onCreate} size="sm" className="w-full">
          <Plus className="size-4" />
          Nova conversa
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            Nenhuma conversa ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                  conv.id === activeId
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground',
                )}
                onClick={() => onSelect(conv.id)}
              >
                <MessageSquare className="size-3.5 shrink-0 opacity-50" />
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
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
  /** Drawer da lista de conversas — só existe no mobile. */
  const [mobileListOpen, setMobileListOpen] = useState(false);

  /**
   * Carga inicial: conversas + disponibilidade do agente.
   *
   * O estado é atualizado DENTRO dos callbacks assíncronos (nunca no corpo do
   * efeito, o que dispararia renders em cascata) e `setActiveId` usa a forma
   * funcional. Com isso o efeito deixa de depender de `activeId` e roda uma
   * única vez — antes precisava silenciar o `exhaustive-deps` justamente por
   * causa dessa dependência.
   */
  useEffect(() => {
    let cancelled = false;

    agentApi
      .listConversations()
      .then((list) => {
        if (cancelled) return;
        setConversations(list);
        setActiveId((current) => current ?? list[0]?.id ?? null);
      })
      .catch(() => {
        /* Sem conversas ainda é um estado válido — a tela mostra o vazio. */
      });

    agentApi
      .checkHealth()
      .then((h) => {
        if (!cancelled) setAgentReady(h.configured);
      })
      .catch(() => {
        if (!cancelled) setAgentReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = useCallback(async () => {
    const conv = await agentApi.createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await agentApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId],
  );

  return (
    /* Altura = viewport - topbar (56px) - respiro vertical do <main>, que é
       responsivo: py-6 (48px) até lg, py-8 (64px) daí pra cima. Antes havia um
       único `calc(100vh-7.5rem)` assumindo 64px sempre, o que sobrava 16px no
       mobile e virava scroll global.

       `dvh` em vez de `vh` porque no celular a barra de endereço entra e sai
       da tela: com `vh` o composer some atrás dela justamente enquanto se
       digita. `dvh` acompanha a área realmente visível. */
    <div className="flex h-[calc(100dvh-6.5rem)] overflow-hidden rounded-xl border border-border bg-card lg:h-[calc(100dvh-7.5rem)]">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={handleCreate}
        onDelete={handleDelete}
      />

      {/* MOBILE: a mesma lista, em drawer. */}
      <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 p-0">
          <SheetTitle className="sr-only">Suas conversas</SheetTitle>
          <ChatSidebarContent
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => {
              setActiveId(id);
              setMobileListOpen(false);
            }}
            onCreate={() => {
              handleCreate();
              setMobileListOpen(false);
            }}
            onDelete={handleDelete}
          />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        {activeId ? (
          <>
            {/* Header fixo no topo */}
            {/* `min-w-0` + `truncate` em cascata: sem isso o título da conversa
                e o badge empurravam o cabeçalho para 510px numa tela de 390px. */}
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
              <div className="flex min-w-0 items-center gap-2">
                {/* Só no mobile: abre a lista de conversas. */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 md:hidden"
                  onClick={() => setMobileListOpen(true)}
                  aria-label="Ver conversas"
                >
                  <MessageSquare className="size-4" />
                </Button>
                <span className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
                  <Bot className="size-4" />
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-semibold text-foreground">
                    {conversations.find((c) => c.id === activeId)?.title ?? 'Chat'}
                  </h1>
                  {/* Legenda é contexto, não informação — cede espaço primeiro. */}
                  <p className="hidden truncate text-xs text-muted-foreground sm:block">
                    Agente de IA com acesso aos seus dados
                  </p>
                </div>
              </div>
              {agentReady === false ? (
                <Badge variant="destructive" className="shrink-0 gap-1">
                  <AlertCircle className="size-3 shrink-0" />
                  {/* No celular não cabe o nome da variável: vira só o alerta. */}
                  <span className="hidden sm:inline">
                    ANTHROPIC_API_KEY não configurada
                  </span>
                  <span className="sm:hidden">Agente off</span>
                </Badge>
              ) : agentReady === true ? (
                <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                  Agente ativo
                </Badge>
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
              <p className="text-xs">
                O agente de IA tem acesso aos seus dados e ferramentas.
              </p>
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
