import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui';
import { useDeleteUser } from '../hooks/use-users';
import type { User } from '../types';

interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
}: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser();

  const handleConfirm = () => {
    if (!user) return;
    deleteUser.mutate(user.id, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O usuário{' '}
            <span className="font-medium text-foreground">
              {user?.name ?? user?.email}
            </span>{' '}
            será removido permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteUser.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteUser.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteUser.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
