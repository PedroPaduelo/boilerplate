import { useCallback, useState } from 'react';

/**
 * Subconjunto do retorno de `useMutation` (TanStack Query v5) que este hook
 * consome. Tipar contra o objeto inteiro seria correto, mas o tipo completo é
 * pesado (variância de `data`/`error`/`variables`) e não traz benefício aqui
 * — o hook só precisa de `mutate` e `isPending`. Expor uma interface enxuta
 * também facilita mockar o hook em testes.
 */
export interface UseConfirmDeleteMutation<TId> {
  mutate: (id: TId, options?: { onSettled?: () => void }) => void;
  isPending: boolean;
}

export interface UseConfirmDeleteOptions<TItem> {
  /** Hook de mutação (ex.: `useDeleteDashboard()`) — só precisamos de `mutate` + `isPending`. */
  mutation: UseConfirmDeleteMutation<string>;
  /** Extrai o id do item a ser passado para a mutação. */
  getId: (item: TItem) => string;
  /** Extrai o título/nome do item para mostrar no card. Opcional. */
  getTitle?: (item: TItem) => string | undefined;
  /**
   * Texto curto que qualifica o tipo de item (ex.: "dashboard", "gráfico").
   * Reservado para uso futuro (templates, ARIA, etc.) — o card atual não
   * consome. Opcional.
   */
  noun?: string;
}

/**
 * Props prontas para passar ao `<ArtifactCard confirming={...} />`. O card
 * entra em modo de confirmação inline (sem modal, sem overlay, sem portal)
 * enquanto este objeto estiver setado.
 */
export interface UseConfirmDeleteConfirmation {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export interface UseConfirmDeleteReturn<TItem> {
  /** Item pendente de exclusão. `null` quando o card NÃO está em modo de confirmação. */
  deleting: TItem | null;
  /** `true` enquanto há item pendente. Atalho para `deleting !== null`. */
  isOpen: boolean;
  /** `mutation.isPending` repassado para o card. */
  isPending: boolean;
  /** Abre o modo de confirmação para o item informado. */
  openDelete: (item: TItem) => void;
  /**
   * Fecha o modo de confirmação SEM disparar a mutação. Use no `onCancel`
   * do `ArtifactCard` quando o usuário desiste.
   */
  close: () => void;
  /**
   * Dispara a mutação para o item pendente. SEMPRE fecha o card ao final
   * (sucesso OU erro) via `onSettled` do React Query — é o coração do fix:
   * antes, só `onSuccess` resetava o state e qualquer falha (rede, 500, 404)
   * deixava o overlay Radix preso, travando a UI.
   *
   * No-op se não houver item pendente.
   */
  confirm: () => void;
  /**
   * Objeto pronto para passar como prop `confirming` do `<ArtifactCard />`.
   * É `null` quando NÃO há item pendente — passe direto:
   *
   * ```tsx
   * <ArtifactCard
   *   {...}
   *   confirming={deleting?.id === d.id ? deleteConfirmation : undefined}
   * />
   * ```
   */
  confirmation: UseConfirmDeleteConfirmation | null;
}

/**
 * Hook genérico para o fluxo "abrir confirmação de exclusão → executar mutação
 * destrutiva". Centraliza o state do item pendente e SEMPRE fecha o modo de
 * confirmação ao final da mutação (sucesso ou erro).
 *
 * DESIGN DECISÃO: a confirmação é INLINE dentro do próprio `<ArtifactCard>` —
 * NÃO usa `AlertDialog` (Radix). O Radix AlertDialog tem um bug conhecido com
 * `react-remove-scroll`: quando o componente é desmontado durante a animação
 * de saída, o cleanup que destrava `pointer-events: none` no `<body>` pode
 * não rodar, deixando a UI TRAVADA após qualquer fluxo de delete (mesmo
 * após `onSettled`). Confirmar inline no próprio card elimina portal,
 * overlay e focus trap, então não há nada para "destravar".
 *
 * Os toasts de erro/sucesso permanecem DENTRO da mutação chamada
 * (`onSuccess`/`onError` do `useDeleteDashboard` etc.) — este hook não
 * duplica essa responsabilidade.
 */
export function useConfirmDelete<TItem>(
  options: UseConfirmDeleteOptions<TItem>,
): UseConfirmDeleteReturn<TItem> {
  const { mutation, getId } = options;
  const [deleting, setDeleting] = useState<TItem | null>(null);

  const close = useCallback(() => setDeleting(null), []);

  const openDelete = useCallback((item: TItem) => {
    setDeleting(item);
  }, []);

  const confirm = useCallback(() => {
    // Lê o state da closure. `deleting` é o item pendente no momento em que
    // `confirm` foi chamado — o reset do state acontece no `onSettled` da
    // mutação, tanto em sucesso quanto em erro (coração do fix).
    if (!deleting) return;
    const id = getId(deleting);
    mutation.mutate(id, { onSettled: () => setDeleting(null) });
  }, [deleting, getId, mutation]);

  const isOpen = deleting !== null;

  // `confirmation` é derivado: muda de referência quando isPending muda
  // (para que o card re-renderize o estado disabled do botão).
  const confirmation: UseConfirmDeleteConfirmation | null = isOpen
    ? {
        onConfirm: confirm,
        onCancel: close,
        isPending: mutation.isPending,
      }
    : null;

  return {
    deleting,
    isOpen,
    isPending: mutation.isPending,
    openDelete,
    close,
    confirm,
    confirmation,
  };
}
