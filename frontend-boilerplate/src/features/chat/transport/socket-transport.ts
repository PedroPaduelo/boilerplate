/**
 * Transporte do chat por SOCKET, com resposta retomável.
 *
 * Por que trocar o SSE: no SSE a resposta só existia enquanto a conexão
 * estivesse aberta. Sair da tela no meio derrubava o stream e tudo que o agente
 * produzisse depois se perdia para a interface — voltava-se para uma conversa
 * sem resposta, parecendo que o agente tinha travado.
 *
 * Aqui o turno é disparado por POST (que responde na hora, 202) e o conteúdo
 * chega pela sala `chat:{conversationId}`. O estado vive no servidor, então:
 *
 *   - sair da tela NÃO interrompe nada;
 *   - ao voltar, `attach()` lê o texto acumulado e continua escutando a partir
 *     do último pedaço recebido — sem buraco e sem repetição, graças ao número
 *     de sequência que acompanha cada delta.
 */
import type {
  ChatArtifactEvent,
  ChatChartEvent,
  ChatPhaseEvent,
  ChatTitleEvent,
  ChatToolStepEvent,
  ChatUsageEvent,
} from '@dashboards/contracts';
import { apiClient } from '@/shared/lib/api-client';
import { getSocket } from '@/shared/socket/socket-client';
import type { ChatChartPayload, ChatEvent, ChatToolStepPayload } from './types';

export interface RunState {
  runId: string;
  conversationId: string;
  messageId: string;
  status: 'running' | 'done' | 'error';
  text: string;
  seq: number;
  /**
   * Passos já executados neste turno, em ordem (`call` e `result` separados).
   * É o que permite reconstruir a trilha de quem recarregou a página no meio.
   */
  toolSteps: ChatToolStepPayload[];
  error?: string;
}

interface DeltaPayload {
  conversationId: string;
  messageId: string;
  delta: string;
  seq: number;
}

interface DonePayload {
  conversationId: string;
  messageId: string;
  text: string;
}

interface ErrorPayload {
  conversationId: string;
  messageId: string;
  message: string;
}

/** Estado da execução em andamento (ou `null` se não há nenhuma). */
export async function fetchRunState(conversationId: string): Promise<RunState | null> {
  const { data } = await apiClient.get<{ run: RunState | null }>(
    `/agent/chat/${conversationId}/run`,
  );
  return data.run ?? null;
}

/** Dispara um turno. Responde imediatamente; o conteúdo vem pelo socket. */
export async function startRun(
  conversationId: string,
  message: string,
): Promise<{ runId: string }> {
  const { data } = await apiClient.post<{ runId: string }>(
    `/agent/chat/${conversationId}/run`,
    { message },
  );
  return data;
}

/**
 * Tira do payload os campos de roteamento do socket.
 *
 * Quem escuta já filtrou a conversa; deixar `conversationId`/`runId` entrarem na
 * tela convidaria a UI a tomar decisão de roteamento. O resto atravessa INTEIRO
 * — é justamente o que se perdia quando cada campo era copiado à mão.
 */
function stripRouting<T extends { conversationId: string; runId: string }>(
  payload: T,
): Omit<T, 'conversationId' | 'runId'> {
  const rest: Partial<T> = { ...payload };
  delete rest.conversationId;
  delete rest.runId;
  return rest as Omit<T, 'conversationId' | 'runId'>;
}

export interface AttachOptions {
  /** Só entrega deltas ACIMA deste número — é o que evita repetir na retomada. */
  fromSeq?: number;
  onEvent: (event: ChatEvent) => void;
}

/**
 * Escuta a conversa e devolve a função de desligar.
 *
 * Chamar `attach` NÃO interfere na execução: entrar e sair da sala é só uma
 * inscrição. O agente segue no servidor de qualquer jeito.
 */
export function attachToConversation(
  conversationId: string,
  { fromSeq = 0, onEvent }: AttachOptions,
): () => void {
  const socket = getSocket();
  let ultimoSeq = fromSeq;

  const onDelta = (p: DeltaPayload) => {
    if (p.conversationId !== conversationId) return;
    // Descarta o que já temos: na retomada o servidor pode reemitir.
    if (p.seq <= ultimoSeq) return;
    ultimoSeq = p.seq;
    onEvent({ type: 'text_delta', messageId: p.messageId, delta: p.delta });
  };

  /**
   * Repassa o passo INTEIRO. Antes só `toolName`/`phase` sobreviviam à travessia
   * e a evidência (SQL, conexão, linhas, duração) era descartada aqui mesmo —
   * o backend mandava, o transporte jogava fora e a tela não tinha o que mostrar.
   */
  const onToolStep = (p: ChatToolStepEvent) => {
    if (p.conversationId !== conversationId) return;
    onEvent({ type: 'tool_step', ...stripRouting(p) });
  };

  const onPhase = (p: ChatPhaseEvent) => {
    if (p.conversationId !== conversationId) return;
    onEvent({ type: 'phase', ...stripRouting(p) });
  };

  const onChart = (p: ChatChartEvent) => {
    if (p.conversationId !== conversationId) return;
    // O contrato do socket tipa `result` como `unknown` (é JSON cru na rede).
    // Quem valida de fato é o BlockRenderer, que já trata bloco inválido.
    onEvent({
      type: 'chart',
      messageId: p.messageId,
      chart: p.chart as ChatChartPayload,
    });
  };

  const onArtifact = (p: ChatArtifactEvent) => {
    if (p.conversationId !== conversationId) return;
    onEvent({ type: 'artifact', ...stripRouting(p) });
  };

  const onUsage = (p: ChatUsageEvent) => {
    if (p.conversationId !== conversationId) return;
    onEvent({ type: 'usage', ...stripRouting(p) });
  };

  const onTitle = (p: ChatTitleEvent) => {
    if (p.conversationId !== conversationId) return;
    onEvent({ type: 'title', title: p.title });
  };

  const onDone = (p: DonePayload) => {
    if (p.conversationId !== conversationId) return;
    onEvent({ type: 'message_end', messageId: p.messageId });
  };

  const onError = (p: ErrorPayload) => {
    if (p.conversationId !== conversationId) return;
    onEvent({ type: 'error', message: p.message });
  };

  socket.emit('chat:join', conversationId);
  socket.on('chat:delta', onDelta);
  socket.on('chat:tool-step', onToolStep);
  socket.on('chat:phase', onPhase);
  socket.on('chat:chart', onChart);
  socket.on('chat:artifact', onArtifact);
  socket.on('chat:usage', onUsage);
  socket.on('chat:title', onTitle);
  socket.on('chat:done', onDone);
  socket.on('chat:error', onError);

  return () => {
    socket.off('chat:delta', onDelta);
    socket.off('chat:tool-step', onToolStep);
    socket.off('chat:phase', onPhase);
    socket.off('chat:chart', onChart);
    socket.off('chat:artifact', onArtifact);
    socket.off('chat:usage', onUsage);
    socket.off('chat:title', onTitle);
    socket.off('chat:done', onDone);
    socket.off('chat:error', onError);
    socket.emit('chat:leave', conversationId);
  };
}
