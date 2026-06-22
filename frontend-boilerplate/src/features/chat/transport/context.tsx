/**
 * Provider que injeta a implementação concreta do {@link ChatTransport}.
 *
 * É a costura trocável: hoje o default é o `MockChatTransport`; a T-H2 só passa
 * (ou troca o default por) um `HttpChatTransport` que fale com a API externa — a
 * UI fica intacta. Os testes injetam um transport falso para controlar eventos.
 *
 * O contexto e o hook ficam em arquivos separados (`transport-context.ts` /
 * `use-chat-transport.ts`) para respeitar `react-refresh/only-export-components`.
 */
import type { ReactNode } from 'react';
import type { ChatTransport } from './types';
import { defaultMockTransport } from './mock-transport';
import { ChatTransportContext } from './transport-context';

export interface ChatTransportProviderProps {
  /** Implementação a injetar. Default: MockChatTransport (trocar na T-H2). */
  transport?: ChatTransport;
  children: ReactNode;
}

export function ChatTransportProvider({
  transport = defaultMockTransport,
  children,
}: ChatTransportProviderProps) {
  return (
    <ChatTransportContext.Provider value={transport}>
      {children}
    </ChatTransportContext.Provider>
  );
}
