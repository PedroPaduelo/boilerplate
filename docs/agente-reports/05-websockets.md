# Sistema de WebSockets (Socket.IO) - Relatório de Análise

## Visão Geral

Este documento descreve o sistema de comunicação em tempo real implementado com Socket.IO no projeto boilerplate. O sistema utiliza WebSockets para permitir comunicação bidirecional entre o servidor (backend) e os clientes (frontend).

---

## 1. Configuração Socket.IO

### 1.1 Instalação

**Backend:**
```json
// backend-boilerplate/package.json
"socket.io": "^4.8.1"
```

**Frontend:**
```json
// frontend-boilerplate/package.json
"socket.io-client": "^4.8.3"
```

### 1.2 Configuração do Servidor

**Arquivo:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/src/socket.ts`

```typescript
import type { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import { authenticate } from './middlewares/auth-socket';
import { socketManager } from './socket/manager/socket-manager';
import { registerJoinRoom } from './socket/events/join-room';
import { registerLeaveRoom } from './socket/events/leave-room';
import { registerDisconnect } from './socket/disconnect';
import { env } from './lib/env';

export function setupSocketIO(app: FastifyInstance) {
  // Restrictive CORS for Socket.IO
  const allowedOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map(o => o.trim())
    : env.NODE_ENV === 'production'
      ? []
      : ['http://localhost:5173', 'http://localhost:4000'];

  const io = new Server(app.server, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      methods: ['GET', 'POST'],
      credentials: true,
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
```

### 1.3 Configurações Importantes

| Configuração | Valor | Descrição |
|-------------|-------|-----------|
| CORS | Configurável via `CORS_ORIGINS` | Ambiente produção: origem bloqueada; Desenvolvimento: `localhost:5173`, `localhost:4000` |
| Métodos | GET, POST | Métodos HTTP permitidos para CORS |
| Credentials | true | Permite envio de cookies e headers de autenticação |
| Middleware | JWT Authentication | Obrigatório em todas as conexões |

---

## 2. SocketManager (Gerenciamento de Conexões)

### 2.1 Visão Geral

O `SocketManager` é um **singleton** que gerencia todas as conexões WebSocket, incluindo:
- Conexões ativas (sockets)
- Mapeamento usuário ↔ sockets
- Salas (rooms) e seus participantes
- Envio de mensagens

**Arquivo:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/src/socket/manager/socket-manager.ts`

### 2.2 Interface ConnectedSocket

```typescript
export interface ConnectedSocket {
  socket: Socket;
  userId: string;
  rooms: Set<string>;
  connectedAt: Date;
}
```

### 2.3 Estrutura de Dados

| Mapa | Tipo | Descrição |
|------|------|-----------|
| `connectedSockets` | `Map<string, ConnectedSocket>` | Armazena todas as conexões ativas por ID do socket |
| `userSockets` | `Map<string, Set<string>>` | Mapeia userId → conjunto de socket IDs (um usuário pode ter múltiplas abas/dispositivos) |
| `roomSockets` | `Map<string, Set<string>>` | Mapeia room ID → conjunto de socket IDs participantes |

### 2.4 Métodos Principais

#### `addSocket(socket: Socket)`
Registra uma nova conexão no sistema.
- Adiciona o socket em `connectedSockets`
- Associa o userId ao socket em `userSockets`
- Registra log de conexão

```typescript
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
```

#### `removeSocket(socketId: string)`
Remove uma conexão do sistema.
- Remove de `connectedSockets`
- Remove de `userSockets`
- Remove de todas as `rooms` que o socket participava

#### `joinRoom(socketId: string, room: string)`
Adiciona um socket a uma sala.
- Executa `socket.join(room)` do Socket.IO
- Adiciona a sala ao conjunto de salas do socket
- Registra o socket na estrutura `roomSockets`

#### `leaveRoom(socketId: string, room: string)`
Remove um socket de uma sala.
- Executa `socket.leave(room)` do Socket.IO
- Remove a sala do conjunto de salas do socket
- Limpa a entrada em `roomSockets` se vazia

#### `sendToUser(userId: string, event: string, data: any): boolean`
Envia uma mensagem para um usuário específico.
- Itera sobre todos os sockets ativos do usuário
- Emite o evento para cada socket
- Suporta múltiplas abas/dispositivos simultâneos
- Retorna `true` se enviou com sucesso, `false` se usuário offline

#### `sendToRoom(room: string, event: string, data: any): boolean`
Envia uma mensagem para todos os membros de uma sala.
- Utiliza `io.to(room).emit(event, data)`
- Retorna `false` se instância IO não estiver configurada

#### `broadcast(event: string, data: any): boolean`
Envia uma mensagem para todos os clientes conectados.
- Utiliza `io.emit(event, data)`

#### `isUserConnected(userId: string): boolean`
Verifica se um usuário está online.
- Retorna `true` se o usuário tem pelo menos um socket ativo

#### `getStats()`
Retorna estatísticas do sistema:
```typescript
{
  totalConnections: number,  // Total de conexões ativas
  totalUsers: number,        // Total de usuários únicos conectados
  totalRooms: number         // Total de salas ativas
}
```

---

## 3. Autenticação de Socket

### 3.1 Middleware de Autenticação

**Arquivo:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/src/middlewares/auth-socket.ts`

```typescript
import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
}

export async function authenticate(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // Attach user info to socket
    (socket as any).user_id = decoded.sub;

    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
}
```

### 3.2 Fluxo de Autenticação

```
[Cliente]
  |
  | 1. Conecta com { auth: { token: "JWT_TOKEN" } }
  V
[Middleware authenticate]
  |
  | 2. Extrai token do handshake.auth
  | 3. Valida token com JWT_SECRET
  | 4. Decodifica payload (sub = userId)
  V
[Próximo: connection handler]
  |
  | 5. socketManager.addSocket(socket)
  | 6. Registra event handlers
  V
[Cliente recebe evento 'connected']
```

---

## 4. Eventos Disponíveis

### 4.1 Eventos do Servidor (emitidos pelo backend)

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `connected` | `{ socketId: string, timestamp: string }` | Confirmação de conexão estabelecida |
| `room-joined` | `{ roomId: string }` | Confirmação de entrada na sala |
| `room-left` | `{ roomId: string }` | Confirmação de saída da sala |
| `error` | `{ message: string }` | Mensagem de erro |

### 4.2 Eventos do Cliente (ouvidos pelo backend)

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `join-room` | `roomId: string` | Entra em uma sala |
| `leave-room` | `roomId: string` | Sai de uma sala |
| `disconnect` | `reason: string` | Desconexão (evento nativo Socket.IO) |

### 4.3 Handlers de Eventos

**Join Room:**
```typescript
// backend-boilerplate/src/socket/events/join-room.ts
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
```

**Leave Room:**
```typescript
// backend-boilerplate/src/socket/events/leave-room.ts
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
```

**Disconnect:**
```typescript
// backend-boilerplate/src/socket/disconnect.ts
import type { Socket } from 'socket.io';
import { socketManager } from './manager/socket-manager';

export function registerDisconnect(socket: Socket) {
  socket.on('disconnect', (reason) => {
    console.log(`Socket ${socket.id} disconnected: ${reason}`);
    socketManager.removeSocket(socket.id);
  });
}
```

---

## 5. Frontend Socket Client

### 5.1 Status da Implementação

**IMPORTANTE:** O frontend currently has **socket.io-client installed** (`^4.8.3`) but **has not yet implemented** the socket client code. The package.json includes the dependency, but there is no actual socket connection implementation in the frontend source code.

### 5.2 Exemplo de Implementação Sugerida

Para utilizar o Socket.IO no frontend, seria necessário implementar um cliente similar ao abaixo:

```typescript
// Exemplo de implementação (NÃO EXISTE NO CÓDIGO ATUAL)
import { io, Socket } from 'socket.io-client';

// Configuração de conexão
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

class SocketClient {
  private socket: Socket | null = null;

  connect(token: string): void {
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connected', (data) => {
      console.log('Connection confirmed:', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinRoom(roomId: string): void {
    this.socket?.emit('join-room', roomId);
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit('leave-room', roomId);
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }
}

export const socketClient = new SocketClient();
```

### 5.3 Hook Personalizado Sugerido

```typescript
// Exemplo de hook (NÃO EXISTE NO CÓDIGO ATUAL)
import { useEffect, useCallback } from 'react';
import { socketClient } from '@/shared/lib/socket-client';
import { useAuthStore } from '@/features/auth/store';

export function useSocket() {
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      socketClient.connect(token);
    }

    return () => {
      socketClient.disconnect();
    };
  }, [token]);

  const joinRoom = useCallback((roomId: string) => {
    socketClient.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketClient.leaveRoom(roomId);
  }, []);

  return { joinRoom, leaveRoom, socket: socketClient };
}
```

---

## 6. Casos de Uso

### 6.1 Casos de Uso Implementados

#### 6.1.1 Sistema de Salas (Chat/Colaboração)
- Usuários podem entrar e sair de salas
- Mensagens podem ser enviadas para salas específicas
- Útil para: salas de chat, salas de reunião, canais de equipe

```typescript
// Entrar em uma sala
socket.emit('join-room', 'room-123');

// Receber confirmação
socket.on('room-joined', ({ roomId }) => {
  console.log(`Entrou na sala: ${roomId}`);
});

// Enviar mensagem para sala
socketManager.sendToRoom('room-123', 'message', {
  userId: 'user-1',
  content: 'Olá!',
  timestamp: new Date().toISOString(),
});
```

#### 6.1.2 Notificações em Tempo Real
- Enviar notificações para usuários específicos
- Útil para: alertas, mensagens privadas, atualizações

```typescript
// Notificar um usuário específico
socketManager.sendToUser('user-123', 'notification', {
  title: 'Nova mensagem',
  body: 'Você tem uma nova mensagem de João',
});
```

#### 6.1.3 Broadcast Global
- Enviar mensagens para todos os usuários conectados
- Útil para: anúncios, manutenção, atualizações de sistema

```typescript
// Broadcast para todos
socketManager.broadcast('announcement', {
  title: 'Manutenção programada',
  message: 'Sistema indisponível em 30 minutos',
});
```

### 6.2 Casos de Uso Não Implementados (Sugestões)

#### 6.2.1 Status de Online/Offline
Implementar eventos para rastrear status de usuários:
```typescript
// No connect
socketManager.sendToUser(userId, 'user-online', { userId });

// No disconnect
socketManager.sendToFriends(userId, 'user-offline', { userId });
```

#### 6.2.2 Typing Indicators
Indicador de digitação em salas de chat:
```typescript
// Cliente envia
socket.emit('typing', { roomId: 'room-123' });

// Servidor repassa
socketManager.sendToRoom('room-123', 'user-typing', { userId });
```

#### 6.2.3 Sincronização de Estado
Sincronizar estado em tempo real (ex: documentos colaborativos):
```typescript
socket.emit('document-update', {
  documentId: 'doc-1',
  changes: { /* delta */ }
});
```

#### 6.2.4 Integração com BullMQ
Notificações de jobs:
```typescript
// No worker
worker.on('completed', (job) => {
  socketManager.sendToUser(userId, 'job-completed', {
    jobId: job.id,
    result: job.returnvalue,
  });
});
```

---

## 7. Estrutura de Arquivos

```
backend-boilerplate/src/
├── socket.ts                           # Setup principal do Socket.IO
├── socket/
│   ├── manager/
│   │   └── socket-manager.ts           # Singleton de gerenciamento
│   ├── events/
│   │   ├── join-room.ts                # Handler join-room
│   │   └── leave-room.ts               # Handler leave-room
│   └── disconnect.ts                   # Handler disconnect
└── middlewares/
    └── auth-socket.ts                  # Middleware de autenticação JWT
```

---

## 8. Limitações e Recomendações

### 8.1 Limitações Atuais

1. **Eventos limitados**: Apenas `join-room` e `leave-room` implementados
2. **Frontend não implementado**: Cliente Socket.IO não está sendo utilizado no frontend
3. **Sem suporte a rooms privados**: Validação básica, sem verificação de permissão
4. **Sem reconnection handling**: Cliente não lida com reconexão automática
5. **Sem namespace separado**: Usa namespace padrão `/`

### 8.2 Recomendações de Melhoria

1. **Implementar cliente Socket.IO no frontend**
2. **Adicionar typing indicators**
3. **Adicionar presença online/offline**
4. **Implementar rooms privados com validação de permissão**
5. **Adicionar heartbeats para detectar desconexões**
6. **Considerar uso de Redis Adapter para scaling horizontal**
7. **Adicionar rate limiting por socket**

---

## 9. Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `CORS_ORIGINS` | Origens permitidas separadas por vírgula |
| `JWT_SECRET` | Secret para validação de tokens JWT |
| `NODE_ENV` | Ambiente (production/development) |

---

## Conclusão

O sistema de WebSockets Socket.IO está bem estruturado no backend com:
- Gerenciamento robusto de conexões (SocketManager singleton)
- Autenticação JWT integrada
- Suporte a salas (rooms)
- Mapeamento usuário → sockets (múltiplas conexões por usuário)

**O frontend possui a dependência instalada mas ainda não implementa o cliente Socket.IO.** Para utilizar comunicação em tempo real, será necessário implementar o cliente conforme示例 mostrado na seção 5.2.

---

*Relatório gerado em: 2026-03-14*
*Projeto: boilerplate*
*Versão Socket.IO: ^4.8.1 (backend) / ^4.8.3 (frontend)*
