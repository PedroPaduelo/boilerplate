/**
 * Helpers de Socket.IO compartilhados (nomes de evento + sala do dashboard).
 * Reexporta SOCKET_EVENTS (fonte única dos nomes) e tipa o mapa evento->payload.
 */
import { SOCKET_EVENTS } from '../schemas/socket-events.schema';
import type {
  BlockQueuedEvent,
  BlockRunningEvent,
  BlockDataEvent,
  BlockErrorEvent,
} from '../types';

export { SOCKET_EVENTS };
export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

/** Nome da sala (room) por dashboard: o FE entra, o worker emite p/ ela. */
export function dashboardRoom(dashboardId: string): string {
  return `dashboard:${dashboardId}`;
}

/**
 * Avisos do trabalho do AGENTE (server -> client).
 *
 * O agente executa no servidor, então a tela não tem como perceber sozinha o
 * que ele fez. Sem estes avisos, um gráfico criado pelo agente só aparecia
 * depois de um F5, e quem saía da tela do chat achava que a resposta tinha
 * morrido (não morre: a execução continua e é persistida — falta só avisar).
 */
export interface ArtifactChangedEvent {
  kind: 'chart' | 'dashboard';
  /** Tool do agente que provocou a mudança (ex.: `publish_chart`). */
  tool: string;
  chartId?: string;
  dashboardId?: string;
}

export interface ChatTurnCompleteEvent {
  conversationId: string;
  /** true quando o turno terminou em erro (a mensagem de erro foi persistida). */
  failed: boolean;
}

/** Mapa tipado evento -> payload (server -> client). */
export interface ServerToClientEvents {
  [SOCKET_EVENTS.BLOCK_QUEUED]: (payload: BlockQueuedEvent) => void;
  [SOCKET_EVENTS.BLOCK_RUNNING]: (payload: BlockRunningEvent) => void;
  [SOCKET_EVENTS.BLOCK_DATA]: (payload: BlockDataEvent) => void;
  [SOCKET_EVENTS.BLOCK_ERROR]: (payload: BlockErrorEvent) => void;
  'artifact:changed': (payload: ArtifactChangedEvent) => void;
  'chat:turn-complete': (payload: ChatTurnCompleteEvent) => void;
}
