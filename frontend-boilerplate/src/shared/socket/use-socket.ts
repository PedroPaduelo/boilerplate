import { useContext } from 'react';
import { SocketContext, type SocketContextValue } from './socket-context';

/**
 * Hook de acesso ao socket global. Deve ser usado dentro de `<SocketProvider>`
 * (montado em `AppProviders`).
 *
 * Exemplo (T-G):
 *   const { getSocket, joinDashboard, leaveDashboard, connected } = useSocket();
 *   useEffect(() => { joinDashboard(id); return () => leaveDashboard(id); }, [id]);
 *   useEffect(() => {
 *     const s = getSocket();
 *     if (!s) return;
 *     s.on(SOCKET_EVENTS.BLOCK_DATA, handler);
 *     return () => s.off(SOCKET_EVENTS.BLOCK_DATA, handler);
 *   }, [connected]);
 */
export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket() deve ser usado dentro de <SocketProvider>');
  }
  return ctx;
}
