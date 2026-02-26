import type { Socket } from 'socket.io';
import { socketManager } from '../manager/socket-manager';

export function registerLeaveRoom(socket: Socket) {
  socket.on('leave-room', (roomId: string) => {
    if (!roomId || typeof roomId !== 'string') {
      socket.emit('error', { message: 'Invalid room ID' });
      return;
    }

    socketManager.leaveRoom(socket.id, roomId);
    socket.emit('room-left', { roomId });
  });
}
