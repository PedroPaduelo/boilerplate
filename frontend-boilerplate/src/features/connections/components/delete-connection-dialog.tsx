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
import { useDeleteConnection } from '../hooks';
import type { Connection } from '../types';

interface DeleteConnectionDialogProps {
  connection: Connection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteConnectionDialog({
  connection,
  open,
  onOpenChange,
}: DeleteConnectionDialogProps) {
  const deleteConnection = useDeleteConnection();

  const handleConfirm = () => {
    if (!connection) return;
    deleteConnection.mutate(connection.id, {
      onSettled: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir conexão?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. A conexão{' '}
            <span className="font-medium text-foreground">
              {connection?.name}
            </span>{' '}
            será removida permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteConnection.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteConnection.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteConnection.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
