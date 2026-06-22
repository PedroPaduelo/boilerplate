/**
 * Camada de Socket.IO compartilhada (infra cross-feature).
 *
 * - `SocketProvider`: montado em `AppProviders`.
 * - `useSocket()`: hook de acesso (socket + helpers de sala).
 * - `getSocket`/`disconnectSocket`: acesso de baixo nível ao singleton.
 */
export { SocketProvider } from './socket-provider';
export { useSocket } from './use-socket';
export { getSocket, disconnectSocket, type AppSocket } from './socket-client';
export { SocketContext, type SocketContextValue } from './socket-context';
