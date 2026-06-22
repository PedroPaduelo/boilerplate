import { createContext } from 'react';
import type { AppSocket } from './socket-client';

export interface SocketContextValue {
  /** true quando o handshake conectou. */
  connected: boolean;
  /**
   * Retorna a instância do socket (ou null se não autenticado/conectado).
   * Chame DENTRO de effects/handlers (nunca durante o render) — ex.:
   * `useEffect(() => { const s = getSocket(); s?.on(...) }, [connected])`.
   */
  getSocket: () => AppSocket | null;
  /** Entra na sala `dashboard:{id}` (emite `dashboard:join`). */
  joinDashboard: (dashboardId: string) => void;
  /** Sai da sala `dashboard:{id}` (emite `dashboard:leave`). */
  leaveDashboard: (dashboardId: string) => void;
}

export const SocketContext = createContext<SocketContextValue | null>(null);
