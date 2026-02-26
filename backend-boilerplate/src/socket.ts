import type { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';

import { authenticate } from './middlewares/auth-socket';
import { socketManager } from './socket/manager/socket-manager';
import { registerJoinRoom } from './socket/events/join-room';
import { registerLeaveRoom } from './socket/events/leave-room';
import { registerDisconnect } from './socket/disconnect';

export function setupSocketIO(app: FastifyInstance) {
  const io = new Server(app.server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  socketManager.setIO(io);

  // Authentication middleware
  io.use(authenticate);

  io.on('connection', async (socket) => {
    try {
      socketManager.addSocket(socket);

      // Register event handlers
      registerJoinRoom(socket);
      registerLeaveRoom(socket);
      registerDisconnect(socket);

      // Send connection confirmation
      socket.emit('connected', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in socket connection:', error);
      socket.disconnect(true);
    }
  });

  console.log('✅ Socket.IO setup complete');

  return io;
}
