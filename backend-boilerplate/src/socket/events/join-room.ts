import type { Socket } from 'socket.io';
import { socketManager } from '../manager/socket-manager';

export function registerJoinRoom(socket: Socket) {
  socket.on('join-room', (roomId: string) => {
    if (!roomId || typeof roomId !== 'string') {
      socket.emit('error', { message: 'Invalid room ID' });
      return;
    }

    socketManager.joinRoom(socket.id, roomId);
    socket.emit('room-joined', { roomId });
  });
}
