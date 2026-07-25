/**
 * Avisa o navegador, por socket, quando o AGENTE mexe num artefato.
 *
 * Sem isto, o agente criava/publicava um gráfico e a tela do usuário continuava
 * mostrando o estado velho até ele apertar F5 — a alteração "não aparecia".
 * Como o agente roda no servidor, o front não tem como saber que algo mudou;
 * o socket é o único caminho.
 *
 * A checagem é por NOME de tool, e não por efeito colateral no service, porque
 * o mesmo service atende também requisições diretas do usuário — nessas, quem
 * pediu já está com a resposta na mão e recarrega sozinho.
 */
import { socketManager } from '@/socket/manager/socket-manager';

/** Evento único que o front escuta para saber que precisa recarregar. */
export const ARTIFACT_CHANGED_EVENT = 'artifact:changed';

/** Tools do agente que ALTERAM estado visível na interface. */
const MUTATING_TOOLS = new Set([
  'create_chart',
  'update_chart',
  'publish_chart',
  'unpublish_chart',
  'delete_chart',
  'create_dashboard',
  'update_dashboard',
  'publish_dashboard',
  'unpublish_dashboard',
  'delete_dashboard',
  'add_chart_to_dashboard',
]);

/** `chart` e `dashboard` viram chaves de cache diferentes no front. */
function artifactKind(toolName: string): 'chart' | 'dashboard' {
  return toolName.includes('dashboard') ? 'dashboard' : 'chart';
}

export interface ArtifactChangedPayload {
  kind: 'chart' | 'dashboard';
  tool: string;
  chartId?: string;
  dashboardId?: string;
}

/**
 * Emite o aviso se a tool for de escrita e tiver dado certo.
 *
 * Nunca lança: uma falha de socket não pode derrubar a execução da tool — o
 * trabalho do agente já foi feito e persistido, o aviso é um extra.
 */
export function notifyArtifactChange(
  userId: string,
  toolName: string,
  result: unknown,
): void {
  if (!MUTATING_TOOLS.has(toolName)) return;
  // Handler devolve `{ error }` em vez de lançar: nada mudou, nada a avisar.
  if (result && typeof result === 'object' && 'error' in result) return;

  try {
    const out = (result ?? {}) as Record<string, unknown>;
    const payload: ArtifactChangedPayload = {
      kind: artifactKind(toolName),
      tool: toolName,
      ...(typeof out.chartId === 'string' ? { chartId: out.chartId } : {}),
      ...(typeof out.dashboardId === 'string' ? { dashboardId: out.dashboardId } : {}),
    };
    socketManager.sendToUser(userId, ARTIFACT_CHANGED_EVENT, payload);
  } catch {
    // socket indisponível: segue o jogo.
  }
}
