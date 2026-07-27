/**
 * Confirmação de EXCLUSÃO de um gráfico.
 *
 * `AlertDialog` (e não uma confirmação inline no card): a ação é destrutiva e
 * irreversível, então precisa de foco preso, rótulo específico no botão e
 * descrição da consequência.
 */
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import type { Chart } from '../types';

export interface DeleteChartDialogProps {
  /** Gráfico pendente de exclusão; `null` fecha o diálogo. */
  chart: Chart | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteChartDialog({
  chart,
  isPending,
  onCancel,
  onConfirm,
}: DeleteChartDialogProps) {
  if (!chart) return null;

  return (
    <AlertDialog
      isOpen
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={`Excluir “${chart.title}”?`}
      description="O gráfico sai da lista e dos dashboards que o usam. Esta ação não pode ser desfeita."
      actionLabel="Sim, excluir"
      cancelLabel="Cancelar"
      isActionLoading={isPending}
      onAction={onConfirm}
    />
  );
}
