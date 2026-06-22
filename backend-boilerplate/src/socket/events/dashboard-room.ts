import type { Socket } from 'socket.io';
import { dashboardRoom } from '@dashboards/contracts';
import { socketManager } from '../manager/socket-manager';

/**
 * Eventos de sala por dashboard (ponto de extensão da Fase 0 para T-C / T-G).
 *
 * O FE entra na sala ao abrir um dashboard (`dashboard:join`) e o worker (T-C)
 * emite os eventos `block:*` (ver `SOCKET_EVENTS` de `@dashboards/contracts`)
 * para a sala `dashboard:{id}` via `socketManager.sendToRoom(...)`.
 *
 * O nome da sala é SEMPRE derivado de `dashboardRoom(id)` (fonte única nos
 * contratos) — BE e FE nunca hardcodam a string `dashboard:` em paralelo.
 *
 * Auth: o handshake já foi autenticado por JWT em `middlewares/auth-socket.ts`
 * (o `user_id` está anexado ao socket) antes deste handler ser registrado.
 */
export function registerDashboardRoom(socket: Socket) {
  socket.on('dashboard:join', (dashboardId: unknown) => {
    if (!dashboardId || typeof dashboardId !== 'string') {
      socket.emit('error', { message: 'Invalid dashboard id' });
      return;
    }

    const room = dashboardRoom(dashboardId);
    socketManager.joinRoom(socket.id, room);
    socket.emit('dashboard:joined', { dashboardId, room });
  });

  socket.on('dashboard:leave', (dashboardId: unknown) => {
    if (!dashboardId || typeof dashboardId !== 'string') {
      socket.emit('error', { message: 'Invalid dashboard id' });
      return;
    }

    const room = dashboardRoom(dashboardId);
    socketManager.leaveRoom(socket.id, room);
    socket.emit('dashboard:left', { dashboardId, room });
  });
}
