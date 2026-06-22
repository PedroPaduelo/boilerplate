import { useContext } from 'react';
import { ChatTransportContext } from './transport-context';
import type { ChatTransport } from './types';

/**
 * Acessa o {@link ChatTransport} injetado pelo `ChatTransportProvider`.
 * A UI consome SEMPRE por aqui — nunca importa o mock direto — de modo que a
 * T-H2 só troca a implementação no provider.
 */
export function useChatTransport(): ChatTransport {
  return useContext(ChatTransportContext);
}
