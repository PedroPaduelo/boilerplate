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

/** Mapa tipado evento -> payload (server -> client). */
export interface ServerToClientEvents {
  [SOCKET_EVENTS.BLOCK_QUEUED]: (payload: BlockQueuedEvent) => void;
  [SOCKET_EVENTS.BLOCK_RUNNING]: (payload: BlockRunningEvent) => void;
  [SOCKET_EVENTS.BLOCK_DATA]: (payload: BlockDataEvent) => void;
  [SOCKET_EVENTS.BLOCK_ERROR]: (payload: BlockErrorEvent) => void;
}
