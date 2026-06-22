import { createContext } from 'react';
import type { ChatTransport } from './types';
import { defaultMockTransport } from './mock-transport';

/**
 * Contexto que carrega a implementação ATIVA do {@link ChatTransport}.
 * Default = MockChatTransport. A T-H2 troca por um `HttpChatTransport` (mesma
 * interface) sem tocar a UI. Mantido em arquivo `.ts` separado do Provider para
 * respeitar `react-refresh/only-export-components` (padrão do shared/socket).
 */
export const ChatTransportContext = createContext<ChatTransport>(defaultMockTransport);
