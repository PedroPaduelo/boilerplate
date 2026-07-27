/**
 * Tradução das ferramentas do agente para o formato do `ChatToolCalls` do DS.
 *
 * O backend emite `tool_step` com o nome técnico da tool (`run_query`,
 * `create_chart`…). O usuário não fala esse idioma: aqui cada nome vira um
 * rótulo em português. Nomes desconhecidos caem no próprio nome — é melhor
 * mostrar algo do que esconder o passo.
 */
import type { ChatToolCallItem, ChatToolCallStatus } from '@astryxdesign/core/Chat';

/** Passo de ferramenta como chega do socket (`chat:tool-step`). */
export interface ChatToolStep {
  /** Id estável do tool call no backend — chave natural para deduplicar. */
  toolCallId: string;
  toolName: string;
  phase: 'call' | 'result';
}

const TOOL_LABELS: Record<string, string> = {
  list_connections: 'Buscando conexões',
  get_connection_schema: 'Analisando tabelas',
  run_query: 'Executando query',
  list_catalog: 'Consultando catálogo',
  create_chart: 'Criando gráfico',
  update_chart: 'Editando gráfico',
  publish_chart: 'Publicando gráfico',
  preview_chart_data: 'Pré-visualizando dados',
  create_dashboard: 'Criando dashboard',
  update_dashboard: 'Editando dashboard',
  add_chart_to_dashboard: 'Adicionando ao dashboard',
  publish_dashboard: 'Publicando dashboard',
  activate_skill: 'Ativando skill',
};

function statusOf(phase: ChatToolStep['phase']): ChatToolCallStatus {
  return phase === 'result' ? 'complete' : 'running';
}

/** Converte os passos do turno atual no `calls` que o `ChatToolCalls` consome. */
export function toChatToolCalls(steps: readonly ChatToolStep[]): ChatToolCallItem[] {
  return steps.map((step) => ({
    key: step.toolCallId,
    name: TOOL_LABELS[step.toolName] ?? step.toolName,
    status: statusOf(step.phase),
  }));
}

/** Rótulo humano de uma ferramenta (usado também fora da lista de tool calls). */
export function toolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName;
}
