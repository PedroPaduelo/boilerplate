'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import type { User } from '../types'

interface UserDeleteAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  user?: User | null
  isLoading?: boolean
  /** Used for bulk delete */
  bulkCount?: number
}

export function UserDeleteAlert({
  open,
  onOpenChange,
  onConfirm,
  user,
  isLoading,
  bulkCount,
}: UserDeleteAlertProps) {
  const isBulk = bulkCount !== undefined && bulkCount > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulk ? 'Excluir Usuários Selecionados' : 'Excluir Usuário'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk ? (
              <>
                Tem certeza que deseja excluir{' '}
                <span className="font-semibold text-foreground">{bulkCount}</span>{' '}
                usuários selecionados? Esta ação não pode ser desfeita.
              </>
            ) : (
              <>
                Tem certeza que deseja excluir o usuário{' '}
                <span className="font-semibold text-foreground">{user?.name}</span>?
                Esta ação não pode ser desfeita e todos os dados associados serão
                removidos permanentemente.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
