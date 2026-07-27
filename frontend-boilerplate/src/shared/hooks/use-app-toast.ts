import { useMemo } from 'react';
import { useToast } from '@astryxdesign/core/Toast';

type ToastFn = (message: string) => void;

export type AppToast = {
  /** Confirmação de ação concluída. Some sozinho. */
  success: ToastFn;
  /** Falha que o usuário precisa ver. Persiste até ser dispensada. */
  error: ToastFn;
  /** Informação neutra. Some sozinho. */
  info: ToastFn;
};

/**
 * Feedback transitório da aplicação.
 *
 * Adapta o `useToast()` do Astryx — que tem dois tipos (`info` | `error`) — para
 * os três verbos que o produto já usava. Sem este ponto único, cada chamada
 * teria que decidir na mão o `type`, e "sucesso" acabaria virando `error` em
 * algum lugar.
 *
 * `success`/`info` somem sozinhos; `error` persiste até o usuário dispensar —
 * mensagem de falha que evapora em 5s é falha que ninguém leu.
 */
export function useAppToast(): AppToast {
  const showToast = useToast();

  return useMemo(
    () => ({
      success: (message) => showToast({ body: message }),
      info: (message) => showToast({ body: message }),
      error: (message) => showToast({ body: message, type: 'error' }),
    }),
    [showToast],
  );
}
