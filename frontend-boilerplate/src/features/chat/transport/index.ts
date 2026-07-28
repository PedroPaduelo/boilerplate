/** Barrel da camada de transporte do chat (o contrato + mock + http + injeção). */
export type {
  ChatRole,
  ChatMessage,
  ChatChartPayload,
  ChatEvent,
  ChatTransport,
  SendMessageOptions,
} from './types';
export type { MockChatTransportOptions } from './mock-transport';
export type { HttpChatTransportOptions } from './http-transport';
export type { MockChartKind } from './mock-data';
