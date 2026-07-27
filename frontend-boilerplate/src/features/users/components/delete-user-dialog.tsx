import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { useDeleteUser } from '../hooks/use-users';
import { userDisplayName } from '../lib/user-labels';
import type { User } from '../types';

export interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Confirmação de exclusão. Ação irreversível pede `AlertDialog`: rótulo do botão
 * diz o que vai acontecer ("Excluir usuário", não "OK") e a descrição nomeia
 * quem será removido.
 */
export function DeleteUserDialog({ user, open, onOpenChange }: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser();

  const handleConfirm = () => {
    if (!user) return;
    deleteUser.mutate(user.id, { onSettled: () => onOpenChange(false) });
  };

  return (
    <AlertDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      title="Excluir usuário?"
      description={
        user
          ? `Esta ação não pode ser desfeita. ${userDisplayName(user)} será removido permanentemente do workspace.`
          : 'Esta ação não pode ser desfeita.'
      }
      actionLabel="Excluir usuário"
      cancelLabel="Cancelar"
      onAction={handleConfirm}
      isActionLoading={deleteUser.isPending}
    />
  );
}
