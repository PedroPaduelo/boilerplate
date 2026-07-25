import type { Socket } from 'socket.io';
import { socketManager } from '../manager/socket-manager';

/**
 * Sala por conversa do chat. É por ela que saem os pedaços da resposta do
 * agente (`chat:delta`, `chat:tool-step`, `chat:done`, `chat:error`).
 *
 * A tela entra na sala ao abrir a conversa e sai ao trocar. Como o estado da
 * execução vive no Redis (`run-store`), sair da sala NÃO interrompe o agente:
 * ao voltar, a tela lê o texto acumulado e volta a escutar do ponto certo.
 *
 * Auth: o handshake já foi autenticado por JWT em `middlewares/auth-socket.ts`.
 */
export function chatRoom(conversationId: string): string {
  return `chat:${conversationId}`;
}

export function registerChatRoom(socket: Socket) {
  socket.on('chat:join', (conversationId: unknown) => {
    if (!conversationId || typeof conversationId !== 'string') {
      socket.emit('error', { message: 'Invalid conversation id' });
      return;
    }
    const room = chatRoom(conversationId);
    socketManager.joinRoom(socket.id, room);
    socket.emit('chat:joined', { conversationId, room });
  });

  socket.on('chat:leave', (conversationId: unknown) => {
    if (!conversationId || typeof conversationId !== 'string') {
      socket.emit('error', { message: 'Invalid conversation id' });
      return;
    }
    const room = chatRoom(conversationId);
    socketManager.leaveRoom(socket.id, room);
    socket.emit('chat:left', { conversationId, room });
  });
}
