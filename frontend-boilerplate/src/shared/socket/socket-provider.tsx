import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { getSocket, disconnectSocket, type AppSocket } from './socket-client';
import { SocketContext, type SocketContextValue } from './socket-context';

/**
 * Provider global do Socket.IO (ponto de composição da Fase 0).
 *
 * Conecta quando o usuário está autenticado (token no store + store hidratado)
 * e desconecta no LOGOUT. Expõe `socket`, `connected` e helpers de sala via
 * `useSocket()`.
 *
 * ## A conexão não é descartável
 *
 * Este efeito roda de novo a cada troca de token — inclusive numa simples
 * renovação. Enquanto o cleanup chamava `disconnectSocket()`, essa renovação
 * derrubava e SUBSTITUÍA a conexão viva: quem já estava escutando (o chat, no
 * meio de uma resposta do agente) ficava preso numa instância morta e a
 * resposta parava ali, sem erro nenhum. Só o logout encerra a conexão; nos
 * demais casos o cleanup solta apenas os OUVINTES.
 *
 * Trocar de token sem reconectar é seguro porque o token é lido do store NO
 * HANDSHAKE (ver `getSocket`): a conexão viva já usa o token novo quando
 * reconecta sozinha.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const socketRef = useRef<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    // Logout: aqui a conexão precisa morrer mesmo — o token dela não vale mais
    // e o servidor autentica no handshake. `connected` não precisa ser
    // desligado à mão: o valor exposto já exige token (ver `value`).
    if (!token) {
      disconnectSocket();
      socketRef.current = null;
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    const sincronizar = () => setConnected(socket.connected);
    socket.on('connect', sincronizar);
    socket.on('disconnect', sincronizar);

    // No-op quando já está conectado (provider remontado sobre uma conexão
    // viva) — e, nesse caso, o socket NÃO reemite `connect`. Sem o aviso
    // adiado abaixo, `connected` ficaria falso para sempre e quem depende dele
    // para se inscrever (ver `useAgentLiveUpdates`) nunca se inscreveria.
    socket.connect();
    if (socket.connected) queueMicrotask(sincronizar);

    return () => {
      socket.off('connect', sincronizar);
      socket.off('disconnect', sincronizar);
    };
  }, [token, isHydrated]);

  const value = useMemo<SocketContextValue>(
    () => ({
      connected: Boolean(token) && connected,
      getSocket: () => socketRef.current,
      joinDashboard: (dashboardId: string) =>
        socketRef.current?.emit('dashboard:join', dashboardId),
      leaveDashboard: (dashboardId: string) =>
        socketRef.current?.emit('dashboard:leave', dashboardId),
    }),
    [connected, token],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
