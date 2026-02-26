import type { Server, Socket } from 'socket.io';

export interface ConnectedSocket {
  socket: Socket;
  userId: string;
  rooms: Set<string>;
  connectedAt: Date;
}

export class SocketManager {
  private static instance: SocketManager;
  private io: Server | null = null;
  private connectedSockets: Map<string, ConnectedSocket> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();
  private roomSockets: Map<string, Set<string>> = new Map();

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public setIO(io: Server): void {
    this.io = io;
    console.log('✅ Socket.IO instance set in SocketManager');
  }

  public getIO(): Server | null {
    return this.io;
  }

  public addSocket(socket: Socket): void {
    const socketId = socket.id;
    const userId = (socket as any).user_id;

    const connectedSocket: ConnectedSocket = {
      socket,
      userId,
      rooms: new Set(),
      connectedAt: new Date(),
    };

    this.connectedSockets.set(socketId, connectedSocket);

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);

    console.log(`Socket ${socketId} connected for user ${userId}`);
  }

  public removeSocket(socketId: string): void {
    const connectedSocket = this.connectedSockets.get(socketId);
    if (!connectedSocket) return;

    const { userId, rooms } = connectedSocket;

    this.connectedSockets.delete(socketId);

    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socketId);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    rooms.forEach((room) => {
      const roomSocketSet = this.roomSockets.get(room);
      if (roomSocketSet) {
        roomSocketSet.delete(socketId);
        if (roomSocketSet.size === 0) {
          this.roomSockets.delete(room);
        }
      }
    });

    console.log(`Socket ${socketId} disconnected for user ${userId}`);
  }

  public joinRoom(socketId: string, room: string): void {
    const connectedSocket = this.connectedSockets.get(socketId);
    if (!connectedSocket) return;

    connectedSocket.socket.join(room);
    connectedSocket.rooms.add(room);

    if (!this.roomSockets.has(room)) {
      this.roomSockets.set(room, new Set());
    }
    this.roomSockets.get(room)!.add(socketId);

    console.log(`Socket ${socketId} joined room ${room}`);
  }

  public leaveRoom(socketId: string, room: string): void {
    const connectedSocket = this.connectedSockets.get(socketId);
    if (!connectedSocket) return;

    connectedSocket.socket.leave(room);
    connectedSocket.rooms.delete(room);

    const roomSocketSet = this.roomSockets.get(room);
    if (roomSocketSet) {
      roomSocketSet.delete(socketId);
      if (roomSocketSet.size === 0) {
        this.roomSockets.delete(room);
      }
    }

    console.log(`Socket ${socketId} left room ${room}`);
  }

  public sendToUser(userId: string, event: string, data: any): boolean {
    const userSocketIds = this.userSockets.get(userId);
    if (!userSocketIds || userSocketIds.size === 0) {
      return false;
    }

    let sent = false;
    userSocketIds.forEach((socketId) => {
      const connectedSocket = this.connectedSockets.get(socketId);
      if (connectedSocket) {
        connectedSocket.socket.emit(event, data);
        sent = true;
      }
    });

    return sent;
  }

  public sendToRoom(room: string, event: string, data: any): boolean {
    if (!this.io) {
      console.error('Socket.IO instance not set');
      return false;
    }

    this.io.to(room).emit(event, data);
    return true;
  }

  public broadcast(event: string, data: any): boolean {
    if (!this.io) {
      console.error('Socket.IO instance not set');
      return false;
    }

    this.io.emit(event, data);
    return true;
  }

  public isUserConnected(userId: string): boolean {
    const userSocketIds = this.userSockets.get(userId);
    return userSocketIds ? userSocketIds.size > 0 : false;
  }

  public getStats() {
    return {
      totalConnections: this.connectedSockets.size,
      totalUsers: this.userSockets.size,
      totalRooms: this.roomSockets.size,
    };
  }
}

export const socketManager = SocketManager.getInstance();
