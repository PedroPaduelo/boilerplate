import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient único da aplicação (TanStack Query).
 *
 * Centralizado aqui para ser consumido pelo `AppProviders` (composição de
 * providers) e, quando necessário fora de componentes (ex.: handlers de socket
 * que fazem `queryClient.setQueryData(...)`), pelas trilhas FE.
 *
 * Convenção de cache (doc 32): o `staleTime` global é conservador; cada feature
 * sobrescreve por query — modo `draft` usa `staleTime: 0` (sempre fresco) e modo
 * `published` usa `staleTime` alto (alinhado ao TTL do bloco).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
