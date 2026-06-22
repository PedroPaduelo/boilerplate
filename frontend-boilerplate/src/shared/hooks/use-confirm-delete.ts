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
  /** Extrai o título/nome do item para mostrar no diálogo. Opcional. */
  getTitle?: (item: TItem) => string | undefined;
  /**
   * Texto curto que qualifica o tipo de item (ex.: "dashboard", "gráfico").
   * Reservado para uso futuro (templates, ARIA, etc.) — o diálogo atual não
   * consome. Opcional.
   */
  noun?: string;
}

export interface UseConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
  itemName?: string;
  noun?: string;
}

export interface UseConfirmDeleteReturn<TItem> {
  /** Item pendente de exclusão. `null` quando o diálogo está fechado. */
  deleting: TItem | null;
  /** `true` enquanto o diálogo está aberto. Atalho para `deleting !== null`. */
  isOpen: boolean;
  /** `mutation.isPending` repassado para o diálogo. */
  isPending: boolean;
  /** Abre o diálogo para o item informado. */
  openDelete: (item: TItem) => void;
  /**
   * Fecha o diálogo SEM disparar a mutação. Use no `onOpenChange` do
   * `AlertDialog` quando o usuário cancela/pressiona Esc/clica fora.
   */
  close: () => void;
  /**
   * Dispara a mutação para o item pendente. SEMPRE fecha o diálogo ao final
   * (sucesso OU erro) via `onSettled` do React Query — é o coração do fix:
   * antes, só `onSuccess` resetava o state e qualquer falha (rede, 500, 404)
   * deixava o overlay Radix preso, travando a UI.
   *
   * No-op se não houver item pendente.
   */
  confirm: () => void;
  /**
   * Spread pronto para o `<ConfirmDeleteDialog />`. Use:
   *
   * ```tsx
   * <ConfirmDeleteDialog title="Excluir dashboard?" {...dialogProps} />
   * ```
   */
  dialogProps: UseConfirmDeleteDialogProps;
}

/**
 * Hook genérico para o fluxo "abrir diálogo de confirmação → executar mutação
 * destrutiva". Centraliza o state do item pendente e o ciclo de vida do
 * diálogo: SEMPRE fecha o overlay ao final da mutação (sucesso ou erro),
 * evitando o anti-padrão que prendia a UI do Radix `AlertDialog` quando a
 * `mutate` falhava.
 *
 * Os toasts de erro/sucesso permanecem DENTRO da mutação chamada
 * (`onSuccess`/`onError` do `useDeleteDashboard` etc.) — este hook não
 * duplica essa responsabilidade.
 */
export function useConfirmDelete<TItem>(
  options: UseConfirmDeleteOptions<TItem>,
): UseConfirmDeleteReturn<TItem> {
  const { mutation, getId, getTitle, noun } = options;
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
  const itemName = deleting && getTitle ? getTitle(deleting) : undefined;

  const dialogProps: UseConfirmDeleteDialogProps = {
    open: isOpen,
    onOpenChange: (o) => {
      if (!o) close();
    },
    isPending: mutation.isPending,
    onConfirm: confirm,
    itemName,
    noun,
  };

  return {
    deleting,
    isOpen,
    isPending: mutation.isPending,
    openDelete,
    close,
    confirm,
    dialogProps,
  };
}
