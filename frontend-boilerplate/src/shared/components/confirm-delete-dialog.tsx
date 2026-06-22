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

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Texto do título (ex.: "Excluir dashboard?"). */
  title: string;
  /** Nome do item a destacar na descrição. */
  itemName?: string;
  onConfirm: () => void;
  isPending?: boolean;
}

/**
 * Diálogo genérico de confirmação de exclusão. A mutação fica na feature
 * (passada via `onConfirm` + `isPending`); este componente só apresenta.
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  itemName,
  onConfirm,
  isPending,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita.{' '}
            {itemName ? (
              <>
                <span className="font-medium text-foreground">{itemName}</span>{' '}
                será removido permanentemente.
              </>
            ) : (
              'O item será removido permanentemente.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
