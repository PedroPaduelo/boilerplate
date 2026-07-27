/**
 * Lista de conversas do agente + disponibilidade do serviço.
 *
 * Vive fora da UI de propósito: a página só recebe dados e callbacks.
 *
 * Usa TanStack Query com as chaves centralizadas (`queryKeys.chat.*`), como o
 * resto do app. Antes era uma máquina de estados manual (`useState` +
 * `useEffect` + contador de reload) — que além de duplicar o que a Query já faz
 * (cache, deduplicação, refetch), esbarrava na regra `set-state-in-effect` do
 * React 19: chamar `setState` no corpo de um efeito encadeia renders.
 *
 * A conversa ativa é DERIVADA, não sincronizada por efeito:
 *   - `undefined` → ninguém escolheu ainda: assume a primeira da lista;
 *   - `null`      → escolha explícita de "nenhuma" (o que acontece ao excluir
 *                   a conversa aberta);
 *   - `string`    → escolha do usuário.
 * Derivar em vez de sincronizar elimina o render extra e o estado que podia
 * divergir da lista.
 */
import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { queryKeys } from '@/shared/lib/query-keys';
import { referenceQueryOptions } from '@/shared/lib/query-policies';
import { agentApi, type Conversation } from './api';

export interface UseConversationsResult {
  conversations: Conversation[];
  activeId: string | null;
  activeConversation: Conversation | null;
  isLoading: boolean;
  /** Falha ao listar — a tela mostra um Banner acionável. */
  error: string | null;
  /** `null` enquanto a checagem de saúde não respondeu. */
  isAgentReady: boolean | null;
  isCreating: boolean;
  select: (id: string) => void;
  reload: () => void;
  create: () => void;
  remove: (id: string) => void;
}

export function useConversations(): UseConversationsResult {
  const toast = useAppToast();
  const queryClient = useQueryClient();

  /** `undefined` = nunca escolheu (assume a primeira); `null` = nenhuma. */
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);

  const conversationsQuery = useQuery({
    queryKey: queryKeys.chat.conversations(),
    queryFn: () => agentApi.listConversations(),
    ...referenceQueryOptions(),
  });

  const healthQuery = useQuery({
    queryKey: queryKeys.chat.health(),
    queryFn: () => agentApi.checkHealth(),
    ...referenceQueryOptions(),
    retry: false,
  });

  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );

  const activeId = selectedId === undefined ? (conversations[0]?.id ?? null) : selectedId;

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId],
  );

  /** Escreve a lista no cache sem esperar o servidor — a barra lateral responde na hora. */
  const writeConversations = useCallback(
    (update: (previous: Conversation[]) => Conversation[]) => {
      queryClient.setQueryData<Conversation[]>(queryKeys.chat.conversations(), (prev) =>
        update(prev ?? []),
      );
    },
    [queryClient],
  );

  const createMutation = useMutation({
    mutationFn: () => agentApi.createConversation(),
    onSuccess: (conversation) => {
      writeConversations((prev) => [conversation, ...prev]);
      setSelectedId(conversation.id);
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Não foi possível criar a conversa.'));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => agentApi.deleteConversation(id),
    onSuccess: (_result, id) => {
      writeConversations((prev) => prev.filter((conversation) => conversation.id !== id));
      // Excluiu a que estava aberta: nenhuma fica aberta (não pula para a
      // vizinha — abrir conversa é decisão do usuário, não efeito colateral).
      setSelectedId((current) =>
        current === id || current === undefined ? null : current,
      );
      toast.success('Conversa excluída.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Não foi possível excluir a conversa.'));
    },
  });

  return {
    conversations,
    activeId,
    activeConversation,
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error
      ? getApiErrorMessage(
          conversationsQuery.error,
          'Não foi possível carregar suas conversas.',
        )
      : null,
    // A saúde só é conclusiva depois da resposta: até lá, `null`.
    isAgentReady: healthQuery.isPending ? null : (healthQuery.data?.configured ?? false),
    isCreating: createMutation.isPending,
    select: setSelectedId,
    reload: () => void conversationsQuery.refetch(),
    create: () => createMutation.mutate(),
    remove: (id: string) => removeMutation.mutate(id),
  };
}
