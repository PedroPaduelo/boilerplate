import type { Socket } from 'socket.io';
import { socketManager } from './manager/socket-manager';

export function registerDisconnect(socket: Socket) {
  socket.on('disconnect', (reason) => {
    console.log(`Socket ${socket.id} disconnected: ${reason}`);
    socketManager.removeSocket(socket.id);
  });
}
