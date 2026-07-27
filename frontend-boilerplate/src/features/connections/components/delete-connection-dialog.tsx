import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { useDeleteConnection } from '../hooks';
import type { Connection } from '../types';

/**
 * Confirmação de exclusão — `AlertDialog` (ação destrutiva e irreversível),
 * nunca um `Dialog` comum: o DS já dá foco no cancelar, papel `alertdialog` e
 * ação em variante destrutiva.
 */
export interface DeleteConnectionDialogProps {
  connection: Connection | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Chamado após exclusão bem-sucedida (ex.: sair do workbench). */
  onDeleted?: () => void;
}

export function DeleteConnectionDialog({
  connection,
  isOpen,
  onOpenChange,
  onDeleted,
}: DeleteConnectionDialogProps) {
  const deleteConnection = useDeleteConnection();

  const handleAction = () => {
    if (!connection) return;
    deleteConnection.mutate(connection.id, {
      onSuccess: () => onDeleted?.(),
      onSettled: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Excluir conexão?"
      description={`A conexão “${connection?.name ?? ''}” será removida permanentemente. Dashboards e gráficos que dependem dela deixam de carregar. Esta ação não pode ser desfeita.`}
      cancelLabel="Cancelar"
      actionLabel="Excluir conexão"
      actionVariant="destructive"
      isActionLoading={deleteConnection.isPending}
      onAction={handleAction}
    />
  );
}
