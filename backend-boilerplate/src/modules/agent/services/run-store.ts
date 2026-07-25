/**
 * Estado de uma execução do agente, guardado FORA da requisição HTTP.
 *
 * É isto que torna a resposta retomável. Antes, o texto só existia enquanto o
 * SSE estava aberto: sair da tela derrubava o stream e, embora o agente
 * continuasse rodando no servidor, tudo que ele produzia no meio do caminho se
 * perdia para a interface — quem voltava só via a resposta pronta no fim, ou
 * nada, se ainda estivesse rodando.
 *
 * Agora cada pedaço é acumulado aqui, numerado. O cliente que volta pergunta
 * "qual o estado da execução?" e recebe o texto acumulado + o número do último
 * pedaço; daí em diante escuta o socket a partir dali, sem buraco nem repetição.
 *
 * Vive no Redis (e não em memória) por dois motivos: sobrevive a restart do
 * processo e funciona com mais de uma instância do backend.
 */
import { redisService } from '@/lib/redis';

/** Uma execução expira 30 min após o último toque — bem além do teto de um turno. */
const RUN_TTL_SECONDS = 30 * 60;

export type RunStatus = 'running' | 'done' | 'error';

export interface RunToolStep {
  toolCallId: string;
  toolName: string;
  phase: 'call' | 'result';
  args?: unknown;
  output?: unknown;
}

export interface RunState {
  runId: string;
  conversationId: string;
  messageId: string;
  status: RunStatus;
  /** Texto acumulado até agora — o que a tela precisa mostrar ao voltar. */
  text: string;
  /** Numeração dos pedaços já emitidos; o cliente usa para não perder nem repetir. */
  seq: number;
  toolSteps: RunToolStep[];
  /** Gráficos produzidos no turno (aparecem embutidos na resposta). */
  charts: unknown[];
  error?: string;
  startedAt: number;
  updatedAt: number;
}

const key = (conversationId: string) => `agent:run:${conversationId}`;

export async function readRun(conversationId: string): Promise<RunState | null> {
  const raw = await redisService.getValue(key(conversationId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RunState;
  } catch {
    return null;
  }
}

async function writeRun(state: RunState): Promise<void> {
  await redisService.setValue(key(state.conversationId), JSON.stringify(state), RUN_TTL_SECONDS);
}

export async function startRun(
  conversationId: string,
  runId: string,
  messageId: string,
): Promise<RunState> {
  const agora = Date.now();
  const state: RunState = {
    runId,
    conversationId,
    messageId,
    status: 'running',
    text: '',
    seq: 0,
    toolSteps: [],
    charts: [],
    startedAt: agora,
    updatedAt: agora,
  };
  await writeRun(state);
  return state;
}

/**
 * Aplica uma mudança no estado e devolve o resultado já persistido.
 *
 * Leitura-modificação-escrita sem lock é aceitável aqui porque só existe UM
 * produtor por conversa (o turno em andamento) — o cliente apenas lê.
 */
export async function patchRun(
  conversationId: string,
  patch: (state: RunState) => void,
): Promise<RunState | null> {
  const state = await readRun(conversationId);
  if (!state) return null;
  patch(state);
  state.updatedAt = Date.now();
  await writeRun(state);
  return state;
}

export async function finishRun(
  conversationId: string,
  status: 'done' | 'error',
  error?: string,
): Promise<void> {
  await patchRun(conversationId, (s) => {
    s.status = status;
    if (error) s.error = error;
  });
}

/** Um turno já encerrado não deve reaparecer como "em andamento" ao voltar. */
export async function clearRun(conversationId: string): Promise<void> {
  await redisService.deleteKey(key(conversationId));
}

/** Há execução viva nesta conversa? (usado para barrar turnos concorrentes) */
export async function isRunning(conversationId: string): Promise<boolean> {
  const state = await readRun(conversationId);
  return state?.status === 'running';
}
