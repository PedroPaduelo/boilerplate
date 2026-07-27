/**
 * Confirmação de EXCLUSÃO de dashboard.
 *
 * Ação destrutiva e irreversível → `AlertDialog` (o DS já cuida de foco, rótulo
 * acessível e do botão de ação em variante destrutiva). O dialog não fecha
 * sozinho no `onAction`: quem fecha é o `onSettled` da mutação, para o estado de
 * carregamento continuar visível enquanto a request está no ar — e para o card
 * voltar ao normal também quando a exclusão FALHA.
 */
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import type { UseConfirmDeleteConfirmation } from '@/shared/hooks/use-confirm-delete';

export interface DeleteDashboardDialogProps {
  /** Título do dashboard pendente. */
  title: string | undefined;
  /** `null` enquanto não há exclusão pendente (dialog fechado). */
  confirmation: UseConfirmDeleteConfirmation | null;
}

export function DeleteDashboardDialog({
  title,
  confirmation,
}: DeleteDashboardDialogProps) {
  return (
    <AlertDialog
      isOpen={confirmation !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) confirmation?.onCancel();
      }}
      title={`Excluir ${title ?? 'dashboard'}?`}
      description="O dashboard sai da lista de todo mundo que tem acesso a ele. Esta ação não pode ser desfeita."
      actionLabel="Excluir"
      cancelLabel="Cancelar"
      isActionLoading={confirmation?.isPending ?? false}
      onAction={() => confirmation?.onConfirm()}
    />
  );
}
