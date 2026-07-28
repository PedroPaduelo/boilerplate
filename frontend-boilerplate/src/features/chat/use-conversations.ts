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
  /** Renomeia a conversa. Título vazio é ignorado — a tela não deixa chegar aqui. */
  rename: (id: string, title: string) => void;
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

  /**
   * Renomear é OTIMISTA: o título novo aparece no cabeçalho e na lista antes da
   * resposta do servidor. Renomear é uma edição de rótulo, não uma operação de
   * risco — esperar o ida-e-volta faria o texto "piscar" de volta ao antigo no
   * meio da digitação de quem está apresentando.
   *
   * Falhou? O título anterior volta e o toast explica. Nada de deixar na tela um
   * nome que o servidor não aceitou.
   */
  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      agentApi.updateConversation(id, title),
    onMutate: ({ id, title }) => {
      const previous = queryClient.getQueryData<Conversation[]>(
        queryKeys.chat.conversations(),
      );
      writeConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === id ? { ...conversation, title } : conversation,
        ),
      );
      return { previous };
    },
    onError: (err: unknown, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.chat.conversations(), context.previous);
      }
      toast.error(getApiErrorMessage(err, 'Não foi possível renomear a conversa.'));
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
    rename: (id: string, title: string) => {
      const clean = title.trim();
      if (!clean) return;
      renameMutation.mutate({ id, title: clean });
    },
  };
}
