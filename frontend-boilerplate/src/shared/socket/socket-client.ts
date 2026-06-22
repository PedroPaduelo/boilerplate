import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents } from '@dashboards/contracts';
import { env } from '@/shared/lib/env';
import { useAuthStore } from '@/features/auth/store';

/**
 * Eventos client->server emitidos pelo FE. Espelham os handlers do BE em
 * `src/socket/events/dashboard-room.ts` (`dashboard:join`/`dashboard:leave`).
 * O nome da sala em si é derivado de `dashboardRoom(id)` no servidor.
 */
export interface ClientToServerEvents {
  'dashboard:join': (dashboardId: string) => void;
  'dashboard:leave': (dashboardId: string) => void;
}

/**
 * Socket tipado: eventos server->client vêm dos contratos (`block:*`); eventos
 * client->server são os de sala (acima).
 */
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

/**
 * Retorna a instância singleton do socket.io-client (lazy). `autoConnect:false`:
 * a conexão só abre quando o `SocketProvider` decide (usuário autenticado).
 *
 * O token JWT é lido do store de auth NO MOMENTO do handshake (`auth` como
 * função), então reconexões sempre usam o token atual. O BE valida em
 * `middlewares/auth-socket.ts` (`socket.handshake.auth.token`).
 */
export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(env.API_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: (cb) => cb({ token: useAuthStore.getState().token ?? '' }),
    });
  }
  return socket;
}

/** Fecha e descarta a instância singleton (logout / unmount do provider). */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
