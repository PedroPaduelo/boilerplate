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
import { apiClient } from '@/shared/lib/api-client';
import { getSocket } from '@/shared/socket/socket-client';
import type { ChatEvent } from './types';

export interface RunState {
  runId: string;
  conversationId: string;
  messageId: string;
  status: 'running' | 'done' | 'error';
  text: string;
  seq: number;
  toolSteps: Array<{
    toolCallId: string;
    toolName: string;
    phase: 'call' | 'result';
    args?: unknown;
    output?: unknown;
  }>;
  error?: string;
}

interface DeltaPayload {
  conversationId: string;
  messageId: string;
  delta: string;
  seq: number;
}

interface ToolStepPayload {
  conversationId: string;
  toolCallId: string;
  toolName: string;
  phase: 'call' | 'result';
  args?: unknown;
  output?: unknown;
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

  const onToolStep = (p: ToolStepPayload) => {
    if (p.conversationId !== conversationId) return;
    onEvent({
      type: 'tool_step',
      toolName: p.toolName,
      toolCallId: p.toolCallId,
      phase: p.phase,
      args: p.args as Record<string, unknown> | undefined,
      output: p.output,
    });
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
  socket.on('chat:done', onDone);
  socket.on('chat:error', onError);

  return () => {
    socket.off('chat:delta', onDelta);
    socket.off('chat:tool-step', onToolStep);
    socket.off('chat:done', onDone);
    socket.off('chat:error', onError);
    socket.emit('chat:leave', conversationId);
  };
}
