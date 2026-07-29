/**
 * Estado de UMA conversa em andamento — reducer puro.
 *
 * Como reducer, cada evento do agente vira UMA transição declarada (antes eram
 * cinco `useState` e a ordem entre os setters importava) e o arquivo pode ser
 * lido e testado sem React no meio.
 *
 * A mudança desta versão: a trilha de auditoria vive JUNTO DA MENSAGEM
 * (`trails[messageId]`). Antes era um campo único da conversa — a trilha da
 * resposta anterior sumia quando chegava uma nova, e nada sobrevivia ao
 * recarregar, mesmo com os passos já gravados no banco.
 */
import type {
  AuditStep,
  ChatArtifact,
  ChatMessageTrail,
  ChatTurnPhase,
  ChatTurnUsage,
} from '../model';
import { EMPTY_TRAIL } from '../model';
import type {
  ChatChartPayload,
  ChatEvent,
  ChatMessage,
  ChatRole,
  ChatToolStepPayload,
} from '../transport/types';
import { mergeToolStep, readPersistedTrail, type TrailSourceRecord } from './chat-tools';

export type { TrailSourceRecord };

export interface ConversationState {
  messages: ChatMessage[];
  /** Trilha de auditoria por mensagem do agente. Sobrevive ao fim do turno. */
  trails: Record<string, ChatMessageTrail>;
  /**
   * Passos do turno em voo antes de a mensagem do agente existir: as ferramentas
   * rodam ANTES do primeiro delta, que é o que abre a bolha da resposta.
   */
  pendingTrail: ChatMessageTrail;
  /** Mensagem que está recebendo a resposta do turno atual. */
  activeMessageId: string | null;
  /** Em que ponto do turno o agente está (`null` fora de um turno). */
  phase: ChatTurnPhase | null;
  /** Frase pronta para a tela ("Consultando teste · Postgres"). */
  phaseLabel: string | null;
  isStreaming: boolean;
  /** Falha do agente, em texto técnico (a UI traduz para linguagem de gente). */
  error: string | null;
  /** Última pergunta enviada — permite reenviar depois de uma falha. */
  lastPrompt: string;
  /** Título que o servidor deu à conversa no fim do primeiro turno. */
  title: string | null;
}

export type ConversationAction =
  /** Histórico recarregado do servidor (abertura da conversa ou fim de turno). */
  | { type: 'loaded'; messages: ChatMessage[]; trails?: Record<string, ChatMessageTrail> }
  /** Pergunta do usuário acabou de ser enviada. */
  | { type: 'sent'; message: ChatMessage }
  /** Turno já em execução no servidor, retomado ao reabrir a tela. */
  | {
      type: 'resumed';
      messageId: string;
      text: string;
      /** Passos já executados neste turno (`call`/`result` ainda separados). */
      steps?: readonly ChatToolStepPayload[];
    }
  /** Evento vindo do socket. */
  | { type: 'event'; event: ChatEvent }
  /** Falha local (o POST que dispara o turno não passou). */
  | { type: 'failed'; message: string }
  /** Usuário parou de acompanhar a resposta (o turno segue no servidor). */
  | { type: 'stopped' };

export const initialConversationState: ConversationState = {
  messages: [],
  trails: {},
  pendingTrail: EMPTY_TRAIL,
  activeMessageId: null,
  phase: null,
  phaseLabel: null,
  isStreaming: false,
  error: null,
  lastPrompt: '',
  title: null,
};

// ---------------------------------------------------------------------------
// Trilha
// ---------------------------------------------------------------------------

/** Insere ou substitui pela chave natural, preservando a ordem de chegada. */
function upsertBy<T>(list: readonly T[], next: T, isSame: (item: T) => boolean): T[] {
  const index = list.findIndex(isSame);
  if (index === -1) return [...list, next];
  const updated = list.slice();
  updated[index] = next;
  return updated;
}

function upsertStep(steps: readonly AuditStep[], next: AuditStep): AuditStep[] {
  return upsertBy(steps, next, (step) => step.toolCallId === next.toolCallId);
}

/** Mesmo artefato tocado duas vezes conta uma vez, com a ÚLTIMA ação. */
function upsertArtifact(
  artifacts: readonly ChatArtifact[],
  next: ChatArtifact,
): ChatArtifact[] {
  return upsertBy(
    artifacts,
    next,
    (artifact) => artifact.kind === next.kind && artifact.id === next.id,
  );
}

/**
 * Identidade de um gráfico para fins de deduplicação.
 *
 * O mesmo gráfico pode chegar duas vezes — reconexão do socket, retomada de um
 * turno em voo — e a resposta não pode ganhar uma cópia a cada reconexão. Sem
 * `chartId` (o mock e o gráfico ainda não salvo não têm), o `blockId` serve; em
 * último caso o título, que é o que distingue os gráficos de um mesmo turno aos
 * olhos de quem lê.
 */
function chartIdentity(chart: ChatChartPayload): string | undefined {
  return chart.chartId ?? chart.result?.blockId ?? chart.title ?? undefined;
}

/**
 * Acrescenta o gráfico à resposta preservando a ORDEM de chegada — que é a
 * ordem em que o agente montou o raciocínio (KPIs, depois série, depois
 * distribuição). Repetição substitui a versão anterior no mesmo lugar em vez de
 * empilhar: um gráfico reemitido é uma correção, não um gráfico novo.
 */
function appendChart(
  charts: readonly ChatChartPayload[] | undefined,
  next: ChatChartPayload,
): ChatChartPayload[] {
  const current = charts ?? [];
  const identity = chartIdentity(next);
  if (identity === undefined) return [...current, next];
  return upsertBy(current, next, (chart) => chartIdentity(chart) === identity);
}

function mergeTrails(base: ChatMessageTrail, extra: ChatMessageTrail): ChatMessageTrail {
  return {
    steps: extra.steps.reduce<AuditStep[]>(upsertStep, base.steps.slice()),
    artifacts: extra.artifacts.reduce<ChatArtifact[]>(
      upsertArtifact,
      base.artifacts.slice(),
    ),
    usage: extra.usage ?? base.usage,
  };
}

function hasContent(trail: ChatMessageTrail): boolean {
  return (
    trail.steps.length > 0 || trail.artifacts.length > 0 || trail.usage !== undefined
  );
}

/**
 * Leva a alteração ao destino certo: a mensagem indicada, a mensagem do turno em
 * voo, ou o depósito pendente enquanto não há mensagem.
 */
function withTrail(
  state: ConversationState,
  messageId: string | undefined,
  update: (trail: ChatMessageTrail) => ChatMessageTrail,
): ConversationState {
  const target = messageId ?? state.activeMessageId;
  if (!target) return { ...state, pendingTrail: update(state.pendingTrail) };
  return {
    ...state,
    trails: {
      ...state.trails,
      [target]: update(state.trails[target] ?? EMPTY_TRAIL),
    },
  };
}

/**
 * A mensagem do agente apareceu: o que estava pendente passa a ser DELA — é o
 * que amarra "executei este SQL" à resposta que veio dele.
 */
function adoptTrail(state: ConversationState, messageId: string): ConversationState {
  if (state.activeMessageId === messageId) return state;
  const merged = mergeTrails(state.trails[messageId] ?? EMPTY_TRAIL, state.pendingTrail);
  return {
    ...state,
    activeMessageId: messageId,
    pendingTrail: EMPTY_TRAIL,
    trails: hasContent(merged) ? { ...state.trails, [messageId]: merged } : state.trails,
  };
}

/** Funde uma sequência de eventos `call`/`result` numa lista de passos. */
function foldToolSteps(events: readonly ChatToolStepPayload[]): AuditStep[] {
  return events.reduce<AuditStep[]>((steps, event) => {
    const previous = steps.find((step) => step.toolCallId === event.toolCallId);
    return upsertStep(steps, mergeToolStep(previous, event));
  }, []);
}

// ---------------------------------------------------------------------------
// Reconciliação com o histórico do servidor
// ---------------------------------------------------------------------------

/**
 * Funde o histórico do servidor com o que JÁ ESTÁ NA TELA — sem nunca regredir.
 *
 * ## O que quebrava
 *
 * O fim do turno dispara uma recarga do histórico (`chat:turn-complete`), e ela
 * SUBSTITUÍA a lista da tela pelo que o servidor devolvesse. Quando o servidor
 * devolvia menos — a gravação da resposta falhou, atrasou, ou a leitura pegou o
 * estado de antes —, a resposta que o usuário estava lendo sumia no instante em
 * que o agente terminava de falar, deixando só a pergunta dele na tela. Do lado
 * de quem usa, o produto simplesmente comia a resposta.
 *
 * ## A regra
 *
 * As duas listas são a MESMA conversa, em ordem, e só crescem no fim. Então o
 * servidor manda no trecho que ele conhece (ele tem os ids reais e a trilha
 * gravada) e o que a tela tem ALÉM disso é mantido: é resposta já entregue ao
 * usuário, não lixo local.
 *
 * Recarregar é uma operação de LEITURA. Leitura não apaga o que está na tela.
 */
export function reconcileHistory(
  local: readonly ChatMessage[],
  server: readonly ChatMessage[],
): ChatMessage[] {
  // O trecho que o servidor conhece, enriquecido com o que só a tela tem.
  const confirmadas = server.map((remota, index) =>
    preserveLocalExtras(remota, local[index]),
  );

  // O rabo que o servidor ainda não tem. Some sozinho na próxima recarga, assim
  // que a gravação alcançar — e até lá continua visível, que é o ponto.
  const pendentes = local.slice(server.length).filter((mensagem) => {
    // Salvaguarda contra desalinhamento: se o servidor já termina com esta
    // mesma fala, repeti-la aqui duplicaria a resposta na tela.
    const ultima = confirmadas[confirmadas.length - 1];
    return !ultima || !isSameMessage(ultima, mensagem);
  });

  return [...confirmadas, ...pendentes];
}

/** Mesma fala? Compara o que o usuário vê, não o id (que muda ao persistir). */
function isSameMessage(a: ChatMessage, b: ChatMessage): boolean {
  return a.role === b.role && a.content.trim() === b.content.trim();
}

/**
 * O registro do servidor manda — menos no que ele não trouxe e a tela tem.
 *
 * Hoje isso vale para os GRÁFICOS: eles viajam junto da mensagem gravada, mas
 * um gráfico grande demais não é persistido (teto de tamanho) e a recarga o
 * traria de volta sem nada. O gráfico já está na tela e é a evidência da
 * resposta — a recarga não é motivo para ele sumir.
 */
function preserveLocalExtras(
  remota: ChatMessage,
  local: ChatMessage | undefined,
): ChatMessage {
  if (!local || !isSameMessage(remota, local)) return remota;
  const charts = remota.charts ?? [];
  if (charts.length > 0 || !local.charts?.length) return remota;
  return { ...remota, charts: local.charts };
}

/** Trilhas das mensagens que continuam na tela — as órfãs não se acumulam. */
function mergeTrailsByMessage(
  local: Record<string, ChatMessageTrail>,
  server: Record<string, ChatMessageTrail>,
  messages: readonly ChatMessage[],
): Record<string, ChatMessageTrail> {
  const vivas = new Set(messages.map((message) => message.id));
  const merged: Record<string, ChatMessageTrail> = {};
  for (const [id, trail] of Object.entries({ ...local, ...server })) {
    if (vivas.has(id)) merged[id] = trail;
  }
  return merged;
}

/**
 * Trilhas de todas as mensagens do histórico, indexadas por `messageId`.
 *
 * É o que faz a auditoria sobreviver ao F5: os passos já estavam gravados em
 * `ChatMessage.toolData`; faltava alguém no front lê-los.
 */
export function buildTrails(
  records: readonly TrailSourceRecord[],
): Record<string, ChatMessageTrail> {
  const trails: Record<string, ChatMessageTrail> = {};
  for (const record of records) {
    const trail = readPersistedTrail(record);
    if (hasContent(trail)) trails[record.id] = trail;
  }
  return trails;
}

// ---------------------------------------------------------------------------
// Seletores
// ---------------------------------------------------------------------------

/** Trilha de uma mensagem — sempre um objeto, nunca `undefined`. */
export function selectTrail(
  state: ConversationState,
  messageId: string,
): ChatMessageTrail {
  return state.trails[messageId] ?? EMPTY_TRAIL;
}

/**
 * Trilha do turno em voo que ainda não pertence a nenhuma mensagem. Some assim
 * que a bolha do agente abre, então a tela pode mostrar as duas sem duplicar.
 */
export function selectPendingTrail(state: ConversationState): ChatMessageTrail {
  return state.activeMessageId ? EMPTY_TRAIL : state.pendingTrail;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function applyEvent(state: ConversationState, event: ChatEvent): ConversationState {
  switch (event.type) {
    case 'message_start': {
      const adopted = adoptTrail(state, event.messageId);
      return {
        ...adopted,
        messages: [...adopted.messages, newAssistantMessage(event.messageId, '')],
      };
    }
    case 'text_delta': {
      // O socket não emite `message_start`: o primeiro delta é que abre a bolha
      // do agente. Sem este upsert os deltas caíam no vazio.
      const adopted = adoptTrail(state, event.messageId);
      const exists = adopted.messages.some((message) => message.id === event.messageId);
      if (!exists) {
        return {
          ...adopted,
          isStreaming: true,
          messages: [
            ...adopted.messages,
            newAssistantMessage(event.messageId, event.delta),
          ],
        };
      }
      return {
        ...adopted,
        messages: adopted.messages.map((message) =>
          message.id === event.messageId
            ? { ...message, content: message.content + event.delta }
            : message,
        ),
      };
    }
    case 'chart': {
      // Mesmo cuidado do delta: o gráfico pode chegar ANTES do primeiro pedaço
      // de texto. Sem abrir a bolha aqui, o gráfico seria descartado em
      // silêncio — e o estado vazio promete justamente "o gráfico pronto".
      const adopted = adoptTrail(state, event.messageId);
      const exists = adopted.messages.some((message) => message.id === event.messageId);
      return {
        ...adopted,
        messages: exists
          ? adopted.messages.map((message) =>
              message.id === event.messageId
                ? { ...message, charts: appendChart(message.charts, event.chart) }
                : message,
            )
          : [
              ...adopted.messages,
              {
                ...newAssistantMessage(event.messageId, ''),
                charts: [event.chart],
              },
            ],
      };
    }
    case 'tool_step':
      return withTrail(state, event.messageId, (trail) => ({
        ...trail,
        steps: upsertStep(
          trail.steps,
          mergeToolStep(
            trail.steps.find((current) => current.toolCallId === event.toolCallId),
            event,
          ),
        ),
      }));
    case 'phase':
      return { ...state, phase: event.phase, phaseLabel: event.label ?? null };
    case 'title':
      return { ...state, title: event.title };
    case 'artifact':
      return withTrail(state, undefined, (trail) => ({
        ...trail,
        artifacts: upsertArtifact(trail.artifacts, {
          kind: event.kind,
          id: event.id,
          title: event.title,
          action: event.action,
        }),
      }));
    case 'usage': {
      // Campo a campo (e não por spread) porque este é o ponto de tradução do
      // evento do socket para o modelo da tela: o que a UI mostra é esta lista.
      const usage: ChatTurnUsage = {
        inputTokens: event.inputTokens,
        outputTokens: event.outputTokens,
        cachedInputTokens: event.cachedInputTokens,
        elapsedMs: event.elapsedMs,
        steps: event.steps,
      };
      return withTrail(state, event.messageId, (trail) => ({ ...trail, usage }));
    }
    case 'error':
      return { ...state, ...IDLE, error: event.message };
    case 'message_end': {
      // Sem texto no fechamento (transporte antigo), nada a reconciliar.
      if (!event.text) return { ...state, ...IDLE };
      return {
        ...state,
        ...IDLE,
        messages: state.messages.map((message) =>
          message.id === event.messageId
            ? { ...message, content: event.text as string }
            : message,
        ),
      };
    }
  }
}

/** Fim do turno: nada em execução, nenhuma fase para anunciar. */
const IDLE = { isStreaming: false, phase: null, phaseLabel: null } as const;

function newAssistantMessage(id: string, content: string): ChatMessage {
  return {
    id,
    role: 'assistant' as ChatRole,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  switch (action.type) {
    case 'loaded': {
      /*
       * Recarregar é LEITURA: repõe os ids reais e a trilha gravada, sem apagar
       * o que a tela já mostra (ver `reconcileHistory`).
       *
       * O turno EM VOO também sobrevive: uma recarga que chegue no meio da
       * resposta não pode desligar o cursor e travar o composer de quem está
       * lendo o agente escrever. Fora de um turno, tudo volta ao repouso.
       */
      const messages = reconcileHistory(state.messages, action.messages);
      const trails = mergeTrailsByMessage(state.trails, action.trails ?? {}, messages);
      const emVoo = state.isStreaming;

      return {
        ...initialConversationState,
        messages,
        trails,
        ...(emVoo
          ? {
              isStreaming: true,
              activeMessageId: state.activeMessageId,
              pendingTrail: state.pendingTrail,
              phase: state.phase,
              phaseLabel: state.phaseLabel,
              lastPrompt: state.lastPrompt,
              title: state.title,
            }
          : {}),
      };
    }
    case 'sent':
      return {
        ...state,
        messages: [...state.messages, action.message],
        // As trilhas das respostas anteriores FICAM: só o turno novo começa do
        // zero. Zerar tudo aqui apagava a auditoria da resposta anterior no
        // instante em que a próxima pergunta era enviada.
        ...IDLE,
        pendingTrail: EMPTY_TRAIL,
        activeMessageId: null,
        isStreaming: true,
        error: null,
        lastPrompt: action.message.content,
      };
    case 'resumed': {
      const adopted = adoptTrail(state, action.messageId);
      const rebuilt: ChatMessageTrail = {
        steps: foldToolSteps(action.steps ?? []),
        artifacts: [],
      };
      const trail = mergeTrails(selectTrail(adopted, action.messageId), rebuilt);
      return {
        ...adopted,
        isStreaming: true,
        trails: hasContent(trail)
          ? { ...adopted.trails, [action.messageId]: trail }
          : adopted.trails,
        messages: [
          ...adopted.messages.filter((message) => message.id !== action.messageId),
          newAssistantMessage(action.messageId, action.text),
        ],
      };
    }
    case 'event':
      return applyEvent(state, action.event);
    case 'failed':
      return { ...state, isStreaming: false, error: action.message };
    case 'stopped':
      return { ...state, ...IDLE };
  }
}
