/**
 * Tradução das ferramentas do agente para o vocabulário da TELA.
 *
 * Três traduções moram aqui, todas puras (sem React, sem socket):
 *
 *  1. nome técnico → rótulo em português (`run_query` → "Executando consulta");
 *  2. evento do socket → {@link AuditStep} — é aqui que `call` e `result` da
 *     mesma ferramenta viram UM passo com estado, em vez de dois eventos soltos;
 *  3. `toolData` persistido → passo, para a trilha sobreviver ao recarregar.
 *
 * O que NÃO mora aqui: JSX. O `resultDetail` de cada passo é montado no
 * `audit-trail.tsx`, que recebe um `renderSlots` e devolve os pedaços visuais.
 */
import type { ReactNode } from 'react';
import type { ChatToolCallItem, ChatToolCallStatus } from '@astryxdesign/core/Chat';
import type {
  AuditStep,
  ChatArtifact,
  ChatMessageTrail,
  ChatStepPreview,
  ChatStepStatus,
  ChatTurnUsage,
} from '../model';
import type { ChatChartPayload, ChatToolStepPayload } from '../transport/types';

/**
 * Rótulos humanos das tools do MCP — usados como PLANO B.
 *
 * A fonte da verdade é o servidor: todo passo novo chega com `title` pronto
 * (`services/audit-trail.ts`). Este mapa só entra em ação para conversas
 * ANTIGAS, gravadas antes da trilha de auditoria existir, cujo `toolData` tem
 * apenas o nome técnico da ferramenta.
 *
 * ⚠️ Por isso os textos precisam ser IDÊNTICOS aos do `TOOL_TITLES` do backend.
 * Enquanto divergiam, o mesmo passo aparecia como "Buscando conexões" numa
 * conversa velha e "Listando conexões" numa nova — dois nomes para o mesmo
 * fato, dependendo só da data. Ao mexer aqui, mexa lá (e vice-versa).
 *
 * Nome desconhecido cai no próprio nome: uma tool nova precisa aparecer feia na
 * trilha, não sumir dela.
 */
const TOOL_LABELS: Record<string, string> = {
  // Conexões e dados
  list_connections: 'Listando conexões',
  get_connection_schema: 'Lendo o schema do banco',
  run_query: 'Executando consulta',
  list_catalog: 'Consultando o catálogo de blocos',
  // Gráficos
  list_charts: 'Listando gráficos',
  create_chart: 'Criando gráfico',
  update_chart: 'Atualizando gráfico',
  publish_chart: 'Publicando gráfico',
  preview_chart_data: 'Pré-visualizando dados do gráfico',
  delete_chart: 'Excluindo gráfico',
  unpublish_chart: 'Despublicando gráfico',
  // Dashboards
  list_dashboards: 'Listando dashboards',
  create_dashboard: 'Criando dashboard',
  update_dashboard: 'Atualizando dashboard',
  add_chart_to_dashboard: 'Adicionando gráfico ao dashboard',
  publish_dashboard: 'Publicando dashboard',
  delete_dashboard: 'Excluindo dashboard',
  unpublish_dashboard: 'Despublicando dashboard',
  create_dashboard_share_link: 'Gerando link de compartilhamento',
  // Agente
  activate_skill: 'Ativando skill',
};

/**
 * Ferramentas que APAGAM ou despublicam.
 *
 * O servidor manda `isDestructive` no evento; este prefixo é o plano B para
 * histórico antigo (que não tem o campo) e para tools novas que ninguém
 * lembrou de marcar. Errar para o lado de destacar é o certo aqui: deixar de
 * avisar uma exclusão é pior do que avisar demais.
 */
const DESTRUCTIVE_PREFIX = /^(delete|unpublish|remove|drop|revoke)_/;

export function toolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName;
}

function isDestructiveTool(toolName: string): boolean {
  return DESTRUCTIVE_PREFIX.test(toolName);
}

/**
 * Duração para gente: `340 ms`, `1,2 s`, `1 min 5 s`.
 *
 * Vírgula decimal e espaço antes da unidade seguem o padrão pt-BR — "1.2s"
 * num produto em português é ruído que o leitor precisa converter de cabeça.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1).replace('.', ',')} s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

/** Contagem com separador de milhar pt-BR (128 → "128", 12345 → "12.345"). */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/** `ChatStepStatus` (nosso) → status do `ChatToolCalls` (do DS). */
function toCallStatus(status: ChatStepStatus): ChatToolCallStatus {
  if (status === 'running') return 'running';
  return status === 'error' ? 'error' : 'complete';
}

/**
 * Funde o evento do socket no passo que já existia.
 *
 * O `call` abre o passo (`running`) e o `result` o fecha — e o `result` costuma
 * vir SEM os campos que só o `call` tinha (e vice-versa). Por isso cada campo
 * novo só sobrescreve o anterior quando vem preenchido: um `result` sem `sql`
 * não pode apagar o SQL que o `call` trouxe.
 */
export function mergeToolStep(
  previous: AuditStep | undefined,
  event: ChatToolStepPayload,
): AuditStep {
  const status: ChatStepStatus =
    event.status ?? (event.phase === 'result' ? 'ok' : 'running');

  return {
    toolCallId: event.toolCallId,
    toolName: event.toolName || previous?.toolName || '',
    title: event.title ?? previous?.title ?? toolLabel(event.toolName),
    target: event.target ?? previous?.target,
    summary: event.summary ?? previous?.summary,
    // `running` nunca sobrescreve um desfecho já conhecido: o `call` pode
    // chegar depois do `result` numa retomada, e o passo voltaria a "rodando".
    status:
      status === 'running' && previous && previous.status !== 'running'
        ? previous.status
        : status,
    durationMs: event.durationMs ?? previous?.durationMs,
    errorMessage: event.errorMessage ?? previous?.errorMessage,
    sql: event.sql ?? previous?.sql,
    connectionName: event.connectionName ?? previous?.connectionName,
    rowCount: event.rowCount ?? previous?.rowCount,
    preview: event.preview ?? previous?.preview,
    isDestructive:
      event.isDestructive ?? previous?.isDestructive ?? isDestructiveTool(event.toolName),
  };
}

// ---------------------------------------------------------------------------
// Leitura do histórico persistido (`ChatMessage.toolData`)
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asStatus(value: unknown): ChatStepStatus | undefined {
  return value === 'running' || value === 'ok' || value === 'error' ? value : undefined;
}

function asPreview(value: unknown): ChatStepPreview | undefined {
  if (!isRecord(value)) return undefined;
  const { columns, rows } = value;
  if (!Array.isArray(columns) || !Array.isArray(rows)) return undefined;
  if (!columns.every((column) => typeof column === 'string')) return undefined;
  if (!rows.every((row) => Array.isArray(row))) return undefined;
  return {
    columns: columns as string[],
    rows: rows as ChatStepPreview['rows'],
    totalRows: asNumber(value.totalRows),
  };
}

/**
 * `args` pode chegar como objeto OU como string JSON (o provedor às vezes
 * serializa). Aceitamos as duas para não perder o SQL de conversas antigas.
 */
function parseArgs(value: unknown): Record<string, unknown> | undefined {
  if (isRecord(value)) return value;
  if (typeof value !== 'string') return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Lê UM passo persistido, aceitando os dois formatos.
 *
 * - NOVO: já vem no formato de auditoria (`title`, `status`, `sql`, `preview`…).
 * - ANTIGO: `{toolCallId, toolName, args, output}` — só o par de execução. Dá
 *   para recuperar bastante coisa: o `run_query` guarda o SQL em `args.sql` e
 *   o `rowCount`/`durationMs` no `output`. Uma conversa de antes da auditoria
 *   volta a ser auditável em vez de aparecer como uma linha muda.
 *
 * Qualquer coisa que não seja um objeto com `toolCallId` é descartada — um
 * `toolData` corrompido não pode derrubar a conversa inteira.
 */
export function readPersistedStep(value: unknown): AuditStep | null {
  if (!isRecord(value)) return null;
  const toolCallId = asString(value.toolCallId);
  if (!toolCallId) return null;

  const toolName = asString(value.toolName) ?? '';
  const args = parseArgs(value.args);
  const output = isRecord(value.output) ? value.output : undefined;
  const errorMessage = asString(value.errorMessage) ?? asString(output?.error);

  return {
    toolCallId,
    toolName,
    title: asString(value.title) ?? toolLabel(toolName),
    target: asString(value.target),
    summary: asString(value.summary),
    status: asStatus(value.status) ?? (errorMessage ? 'error' : 'ok'),
    durationMs: asNumber(value.durationMs) ?? asNumber(output?.durationMs),
    errorMessage,
    sql: asString(value.sql) ?? asString(args?.sql),
    connectionName: asString(value.connectionName),
    rowCount: asNumber(value.rowCount) ?? asNumber(output?.rowCount),
    preview: asPreview(value.preview),
    isDestructive:
      typeof value.isDestructive === 'boolean'
        ? value.isDestructive
        : isDestructiveTool(toolName),
  };
}

/** O mínimo que precisamos de uma mensagem do banco para remontar a trilha. */
export interface TrailSourceRecord {
  id: string;
  /** `{steps, artifacts, usage}` (novo), array de passos (antigo) ou `null`. */
  toolData?: unknown;
  tokensIn?: number | null;
  tokensOut?: number | null;
}

const ARTIFACT_ACTIONS: ChatArtifact['action'][] = [
  'created',
  'updated',
  'published',
  'unpublished',
  'deleted',
];

function readArtifact(value: unknown): ChatArtifact | null {
  if (!isRecord(value)) return null;
  const { kind, id, title, action } = value;
  if (kind !== 'chart' && kind !== 'dashboard') return null;
  if (typeof id !== 'string') return null;
  // Ação fora da lista é dado que não sabemos apresentar: descartamos o
  // artefato inteiro em vez de inventar um rótulo para ele.
  const known = ARTIFACT_ACTIONS.find((candidate) => candidate === action);
  if (!known) return null;
  return { kind, id, title: asString(title) ?? id, action: known };
}

function readUsage(value: unknown, record: TrailSourceRecord): ChatTurnUsage | undefined {
  const source = isRecord(value) ? value : {};
  const usage: ChatTurnUsage = {
    // `tokensIn`/`tokensOut` são colunas próprias desde sempre — e nunca foram
    // lidas. Servem de piso para mensagens gravadas antes do evento de consumo.
    inputTokens: asNumber(source.inputTokens) ?? asNumber(record.tokensIn),
    outputTokens: asNumber(source.outputTokens) ?? asNumber(record.tokensOut),
    cachedInputTokens: asNumber(source.cachedInputTokens),
    elapsedMs: asNumber(source.elapsedMs),
    steps: asNumber(source.steps),
  };
  return Object.values(usage).some((entry) => entry !== undefined) ? usage : undefined;
}

/**
 * Remonta a trilha de UMA mensagem a partir do que está no banco.
 *
 * Tolera os dois formatos e o lixo: `toolData` pode ser `null` (mensagem do
 * usuário), o array antigo de passos, o objeto novo `{steps, artifacts, usage}`
 * ou algo corrompido. Nenhum deles pode impedir a conversa de abrir.
 */
export function readPersistedTrail(record: TrailSourceRecord): ChatMessageTrail {
  const data = record.toolData;
  const rawSteps = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.steps)
      ? data.steps
      : [];
  const rawArtifacts =
    isRecord(data) && Array.isArray(data.artifacts) ? data.artifacts : [];

  return {
    steps: rawSteps
      .map(readPersistedStep)
      .filter((step): step is AuditStep => step !== null),
    artifacts: rawArtifacts
      .map(readArtifact)
      .filter((artifact): artifact is ChatArtifact => artifact !== null),
    usage: readUsage(isRecord(data) ? data.usage : null, record),
  };
}

/**
 * Os gráficos persistidos junto da mensagem (`toolData.charts`).
 *
 * O backend grava os gráficos do turno na mesma linha da mensagem justamente
 * para isto: o Redis do turno expira em 30 min e o socket só alcança quem
 * estava com a tela aberta. Sem esta leitura, o gráfico — o PRODUTO da
 * resposta — sumia no primeiro F5, sobrando o texto e a trilha.
 *
 * Devolve TODOS os válidos, na ordem em que o agente os produziu. Antes esta
 * função devolvia só o último: um pedido de painel gera meia dúzia de gráficos
 * num turno só, e ao reabrir a conversa cinco deles simplesmente não existiam.
 *
 * A validação aqui é de FORMA (título, tipo de bloco e a presença de `result`);
 * quem valida o conteúdo do bloco é o BlockRenderer, que já trata bloco
 * inválido — mesmo contrato do transporte por socket. Um gráfico corrompido é
 * pulado sem levar os irmãos junto.
 */
export function readPersistedCharts(record: TrailSourceRecord): ChatChartPayload[] {
  const data = record.toolData;
  if (!isRecord(data) || !Array.isArray(data.charts)) return [];

  const charts: ChatChartPayload[] = [];
  for (const candidate of data.charts) {
    if (!isRecord(candidate)) continue;
    if (!asString(candidate.title)) continue;
    if (!asString(candidate.catalogType)) continue;
    // Sem dados não há o que desenhar — um gráfico gravado sem `result` cai
    // fora em vez de virar um cartão vazio na conversa.
    if (candidate.result === undefined || candidate.result === null) continue;
    charts.push(candidate as unknown as ChatChartPayload);
  }
  return charts;
}

// ---------------------------------------------------------------------------
// Saída para o componente do DS
// ---------------------------------------------------------------------------

/**
 * O passo tem evidência para mostrar?
 *
 * É o que decide se a linha vira expansível (no DS, uma linha só é `button`
 * quando tem `resultDetail`). Abrir para o vazio é pior do que não abrir.
 * A lista abaixo espelha os campos que o `AuditStepDetail` desenha.
 */
export function hasStepEvidence(step: AuditStep): boolean {
  return Boolean(
    step.sql ||
    step.preview ||
    step.errorMessage ||
    step.connectionName !== undefined ||
    step.rowCount !== undefined ||
    step.durationMs !== undefined,
  );
}

/** Pedaços visuais de um passo — montados no componente, não aqui. */
export interface AuditStepSlots {
  /** Conteúdo expansível da linha: a evidência (SQL, amostra, erro). */
  resultDetail?: ReactNode;
  /** Marcas ao lado do rótulo (ex.: o selo de ação destrutiva). */
  stats?: ReactNode;
}

/**
 * Converte os passos no `calls` que o `ChatToolCalls` consome.
 *
 * O `target` do DS recebe o alvo E o resumo ("messages · 128 linhas"): são as
 * duas informações que fazem a linha valer sem precisar abrir.
 *
 * O parâmetro tem default `[]` de propósito — a tela pode pedir a trilha de uma
 * mensagem que ainda não tem nenhuma.
 */
export function toChatToolCalls(
  steps: readonly AuditStep[] = [],
  renderSlots?: (step: AuditStep) => AuditStepSlots,
): ChatToolCallItem[] {
  return steps.map((step) => {
    const slots = renderSlots?.(step) ?? {};
    const detail = [step.target, step.summary].filter(Boolean).join(' · ');
    return {
      key: step.toolCallId,
      name: step.title || toolLabel(step.toolName),
      status: toCallStatus(step.status),
      target: detail || undefined,
      duration:
        step.durationMs !== undefined ? formatDuration(step.durationMs) : undefined,
      errorMessage: step.errorMessage,
      stats: slots.stats,
      resultDetail: slots.resultDetail,
    };
  });
}
