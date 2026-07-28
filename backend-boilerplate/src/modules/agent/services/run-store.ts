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
import type { ChatChartPayload, ChatStepPreview, ChatStepStatus } from '@dashboards/contracts';

import { redisService } from '@/lib/redis';

/** Uma execução expira 30 min após o último toque — bem além do teto de um turno. */
const RUN_TTL_SECONDS = 30 * 60;

export type RunStatus = 'running' | 'done' | 'error';

/**
 * Um passo da trilha, JÁ ENRIQUECIDO e já FUNDIDO.
 *
 * Antes daqui saía só `{name, phase, args, output}`: quem reabria a tela no
 * meio de um turno recebia o nome cru da ferramenta e o JSON bruto, ou seja,
 * exatamente a trilha que esta feature existe para substituir. Agora guardamos
 * o que a tela mostra — rótulo, alvo, SQL, linhas, duração —, para que retomar
 * um turno e acompanhar um turno mostrem a MESMA coisa.
 *
 * Fundido: um passo por `toolCallId` (e não um para `call` e outro para
 * `result`). O socket continua emitindo os dois eventos, porque durante o
 * streaming a tela precisa saber que a chamada saiu; o estado retomável não
 * precisa desse meio-termo — ele descreve onde o passo chegou, via `status`.
 */
export interface RunToolStep {
  toolCallId: string;
  toolName: string;
  /** `running` enquanto a ferramenta não voltou. */
  status: ChatStepStatus;
  /**
   * Até onde o passo chegou, no vocabulário do `ChatToolStepEvent`.
   *
   * Redundante com `status` — e mantido de propósito: assim cada item continua
   * sendo um payload de `chat:tool-step` válido, e quem retoma pode tratar o
   * estado gravado exatamente como trata os eventos que chegam pelo socket,
   * sem um caminho de código só para a retomada.
   */
  phase: 'call' | 'result';
  args?: unknown;
  output?: unknown;
  title?: string;
  target?: string;
  summary?: string;
  sql?: string;
  connectionName?: string;
  rowCount?: number;
  durationMs?: number;
  errorMessage?: string;
  isDestructive?: boolean;
  /** Amostra já truncada (ver tetos em `audit-trail`). */
  preview?: ChatStepPreview;
}

/** Artefato tocado no turno — espelha o payload de `chat:artifact`. */
export interface RunArtifact {
  kind: 'chart' | 'dashboard';
  id: string;
  title: string;
  action: 'created' | 'updated' | 'published' | 'unpublished' | 'deleted';
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
  /**
   * Gráficos produzidos no turno (aparecem embutidos na resposta).
   *
   * O campo existia e nunca era preenchido — o estado vazio do chat prometia
   * "com o gráfico pronto para salvar" e quem voltava para a tela não achava
   * gráfico nenhum.
   */
  charts: ChatChartPayload[];
  /** Artefatos criados/alterados até agora — viram cartões na resposta. */
  artifacts: RunArtifact[];
  error?: string;
  startedAt: number;
  updatedAt: number;
}

const key = (conversationId: string) => `agent:run:${conversationId}`;

export async function readRun(conversationId: string): Promise<RunState | null> {
  const raw = await redisService.getValue(key(conversationId));
  if (!raw) return null;
  try {
    const state = JSON.parse(raw) as RunState;
    // Estados gravados por uma versão anterior não têm as coleções novas. Quem
    // lê (a tela que retoma) não deve precisar saber disso.
    if (!Array.isArray(state.toolSteps)) state.toolSteps = [];
    if (!Array.isArray(state.charts)) state.charts = [];
    if (!Array.isArray(state.artifacts)) state.artifacts = [];
    return state;
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
    artifacts: [],
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
