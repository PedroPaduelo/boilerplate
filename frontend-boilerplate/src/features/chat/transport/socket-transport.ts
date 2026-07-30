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
 *
 * A mesma pergunta ("onde está o turno?") é refeita a CADA RECONEXÃO, e não só
 * ao abrir a tela. A sala do socket pertence à CONEXÃO: um socket que cai e
 * volta é outro socket, fora de qualquer sala. Sem reentrar e sem reperguntar,
 * a queda mais banal — um deploy do backend, o wifi oscilando — deixava a
 * resposta parada no meio para sempre, que é o efeito que este transporte veio
 * eliminar.
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
 * PARA o turno em andamento no servidor.
 *
 * Precisa existir porque "parar" não é um evento de tela: enquanto o servidor
 * considerar a conversa ocupada, ela recusa a próxima pergunta com 409. Antes
 * daqui o botão só desligava o cursor local — o turno seguia rodando e a
 * conversa ficava intransitável por até 30 minutos.
 *
 * NUNCA lança: parar é uma saída de emergência. Se a chamada falhar, a tela já
 * saiu do estado de streaming e o usuário pode tentar de novo.
 */
export async function stopRun(conversationId: string): Promise<void> {
  try {
    await apiClient.post(`/agent/chat/${conversationId}/stop`);
  } catch {
    // Sem estado de execução no servidor (turno já terminou): nada a parar.
  }
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
  onEvent: (event: ChatEvent) => void;
  /**
   * O servidor disse em que ponto o turno está.
   *
   * Chamado ao entrar na conversa e a CADA RECONEXÃO — é o conserto do buraco:
   * enquanto o socket esteve fora, os pedaços emitidos não chegaram a ninguém e
   * não voltam sozinhos. Quem trata decide o que fazer com o estado (ver
   * `useRunAttachment`); aqui só garantimos que ele chega.
   */
  onResync?: (run: RunState) => void;
}

/**
 * Escuta a conversa e devolve a função de desligar.
 *
 * Chamar `attach` NÃO interfere na execução: entrar e sair da sala é só uma
 * inscrição. O agente segue no servidor de qualquer jeito.
 *
 * As duas responsabilidades daqui são as que a resposta perdia:
 *
 *  1. ESTAR NA SALA. A sala é por CONEXÃO, não por usuário. Reconectou, é outra
 *     conexão — e ela não está em sala nenhuma. Sem reentrar a cada `connect`,
 *     um deploy do backend ou um wifi oscilando faziam a resposta parar no meio
 *     e nunca mais voltar.
 *
 *  2. SABER ONDE O TURNO ESTÁ. Entrar na sala só garante o que vem DAQUI PARA A
 *     FRENTE; o que passou enquanto estávamos fora está no estado do servidor.
 *     Por isso toda entrada (inclusive a reconexão) pergunta o estado e repara
 *     o que faltou.
 */
export function attachToConversation(
  conversationId: string,
  { onEvent, onResync }: AttachOptions,
): () => void {
  const socket = getSocket();

  let desligado = false;
  /**
   * A qual RESPOSTA o corte de sequência se refere.
   *
   * A numeração dos pedaços recomeça em 1 a cada turno — é o `messageId` que
   * distingue um turno do outro. Guardar só o número (como era feito) fazia o
   * corte do turno anterior valer para o seguinte: a partir da SEGUNDA resposta
   * de cada conversa, todo pedaço chegava com número menor que o do turno
   * passado e era descartado como "repetido". A tela ficava com o cursor
   * piscando e a resposta nunca aparecia.
   */
  let respostaDoCorte: string | undefined;
  let ultimoSeq = 0;
  /**
   * Pedaços que chegam ENQUANTO perguntamos ao servidor onde o turno está.
   *
   * Sem represá-los havia um buraco do tamanho de uma ida e volta HTTP: o que
   * chegasse nesse intervalo era aplicado sobre um texto que a resposta do
   * servidor ia sobrescrever logo em seguida, e sumia.
   */
  let represados: DeltaPayload[] | null = null;

  const entregarDelta = (p: DeltaPayload) => {
    // Turno novo: o corte herdado não vale mais (ver `respostaDoCorte`).
    if (respostaDoCorte !== undefined && p.messageId !== respostaDoCorte) {
      ultimoSeq = 0;
    }
    respostaDoCorte = p.messageId;
    // Descarta o que já temos: na retomada o servidor pode reemitir.
    if (p.seq <= ultimoSeq) return;
    ultimoSeq = p.seq;
    onEvent({ type: 'text_delta', messageId: p.messageId, delta: p.delta });
  };

  const onDelta = (p: DeltaPayload) => {
    if (p.conversationId !== conversationId) return;
    if (represados) {
      represados.push(p);
      return;
    }
    entregarDelta(p);
  };

  /**
   * Pergunta ao servidor em que ponto o turno está e repara o que faltou.
   *
   * O texto do servidor é a verdade até `run.seq`; os pedaços represados que
   * vierem DEPOIS desse número são aplicados por cima, em ordem. É o que faz a
   * retomada não ter buraco nem repetição.
   */
  const sincronizar = async () => {
    represados = [];
    let run: RunState | null = null;
    try {
      run = await fetchRunState(conversationId);
    } catch {
      // Sem estado de execução (ou servidor fora): segue só escutando o socket.
    }
    if (desligado) return;

    const pendentes = represados ?? [];
    represados = null;

    if (run) {
      // Ancora o corte NA RESPOSTA que o servidor está produzindo. Um run já
      // encerrado ancora numa mensagem antiga — e o primeiro pedaço do turno
      // seguinte, com outro `messageId`, zera o corte sozinho.
      respostaDoCorte = run.messageId;
      ultimoSeq = run.seq;
      onResync?.(run);
    }

    for (const p of pendentes) entregarDelta(p);
  };

  const entrarNaSala = () => {
    socket.emit('chat:join', conversationId);
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
    // O texto do fechamento é a RESPOSTA já separada do raciocínio de trabalho
    // (o servidor tira do corpo o "vou conferir o schema…" e o guarda na
    // trilha). Durante o streaming o usuário viu tudo — o que é bom, mostra o
    // trabalho acontecendo; ao fechar, a mensagem passa a ser só a resposta.
    onEvent({ type: 'message_end', messageId: p.messageId, text: p.text });
  };

  const onError = (p: ErrorPayload) => {
    if (p.conversationId !== conversationId) return;
    onEvent({ type: 'error', message: p.message });
  };

  /**
   * Reconectou: é uma conexão NOVA, fora de qualquer sala. Reentrar e
   * ressincronizar são as duas metades do mesmo conserto — sem a primeira, os
   * pedaços seguintes vão para uma sala vazia; sem a segunda, o que passou
   * enquanto estávamos fora fica faltando no meio da resposta.
   */
  const onConnect = () => {
    entrarNaSala();
    void sincronizar();
  };

  socket.on('connect', onConnect);
  // Se ainda não conectou, o `emit` do socket.io ficaria bufferizado e sairia
  // junto com o `chat:join` do `onConnect` — entrar duas vezes na mesma sala.
  if (socket.connected) entrarNaSala();
  void sincronizar();

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
    desligado = true;
    socket.off('connect', onConnect);
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
