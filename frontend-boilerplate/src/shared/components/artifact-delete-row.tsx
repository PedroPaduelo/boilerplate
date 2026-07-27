import { AlertTriangle } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { ListItem } from '@astryxdesign/core/List';

export interface ArtifactDeleteRowProps {
  /** Título do artefato que será excluído. */
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

/**
 * Confirmação de exclusão INLINE, no lugar da própria linha do artefato.
 *
 * Por que não um `AlertDialog`: a confirmação acontece exatamente onde o
 * usuário clicou, sem portal, overlay nem foco preso — o contexto (qual item?)
 * continua visível e nada pode "prender" a página se a mutação falhar. O
 * `role="group"` + `aria-label` dão à linha um nome acessível para quem navega
 * por regiões.
 */
export function ArtifactDeleteRow({
  title,
  onConfirm,
  onCancel,
  isPending = false,
}: ArtifactDeleteRowProps) {
  return (
    <ListItem
      role="group"
      aria-label={`Confirmar exclusão de ${title}`}
      data-testid="artifact-delete-row"
      startContent={<Icon icon={AlertTriangle} color="error" />}
      label={`Excluir ${title}?`}
      description="Esta ação não pode ser desfeita."
      endContent={
        <HStack gap={2} vAlign="center">
          <Button
            label="Cancelar"
            variant="secondary"
            size="sm"
            isDisabled={isPending}
            onClick={onCancel}
            data-testid="cancel-delete"
          />
          <Button
            label={isPending ? 'Excluindo...' : 'Sim, excluir'}
            variant="destructive"
            size="sm"
            isLoading={isPending}
            onClick={onConfirm}
            data-testid="confirm-delete"
          />
        </HStack>
      }
    />
  );
}
