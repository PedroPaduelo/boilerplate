/** Barrel da camada de transporte do chat (o contrato + o mock + a injeção). */
export type {
  ChatRole,
  ChatMessage,
  ChatChartPayload,
  ChatEvent,
  ChatTransport,
  SendMessageOptions,
} from './types';
export { MockChatTransport, defaultMockTransport } from './mock-transport';
export type { MockChatTransportOptions } from './mock-transport';
export { ChatTransportProvider } from './context';
export { useChatTransport } from './use-chat-transport';
export {
  buildMockChart,
  pickChartKind,
  wantsChart,
  type MockChartKind,
} from './mock-data';
