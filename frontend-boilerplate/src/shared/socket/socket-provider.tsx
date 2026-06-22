import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { getSocket, disconnectSocket, type AppSocket } from './socket-client';
import { SocketContext, type SocketContextValue } from './socket-context';

/**
 * Provider global do Socket.IO (ponto de composição da Fase 0).
 *
 * Conecta automaticamente quando o usuário está autenticado (token no store +
 * store hidratado) e desconecta no logout/unmount. Expõe `socket`, `connected`
 * e helpers de sala via `useSocket()`. As trilhas (T-C/T-G) apenas consomem o
 * hook — não reconfiguram o cliente aqui.
 *
 * A instância do socket é guardada num ref (singleton estável); o `connected`
 * é estado de UI atualizado apenas nos callbacks de evento / cleanup (evita
 * setState síncrono no corpo do efeito).
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const socketRef = useRef<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isHydrated || !token) {
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      disconnectSocket();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, isHydrated]);

  const value = useMemo<SocketContextValue>(
    () => ({
      connected,
      getSocket: () => socketRef.current,
      joinDashboard: (dashboardId: string) =>
        socketRef.current?.emit('dashboard:join', dashboardId),
      leaveDashboard: (dashboardId: string) =>
        socketRef.current?.emit('dashboard:leave', dashboardId),
    }),
    [connected],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
