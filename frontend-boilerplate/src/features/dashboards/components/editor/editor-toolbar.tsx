/**
 * Barra de ações do editor: estado da publicação à esquerda, ações à direita.
 *
 * Só UMA ação é primária por vez — enquanto há alterações locais o destaque é
 * "Salvar"; quando o rascunho está salvo mas não publicado, o destaque passa a
 * "Publicar". Botão desabilitado sempre explica o motivo via tooltip, em vez de
 * sumir (o usuário precisa saber que a ação existe e por que não pode usá-la).
 */
import { Save, UploadCloud, XCircle } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import type { ArtifactStatus } from '../../types';

const NO_PUBLISH_PERMISSION =
  'Publicar exige ser dono do dashboard e ter permissão de publicação.';

export interface EditorToolbarProps {
  status: ArtifactStatus;
  isDirty: boolean;
  hasUnpublishedChanges: boolean;
  canPublish: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}

function stateHint(isDirty: boolean, hasUnpublishedChanges: boolean): string {
  if (isDirty) return 'Alterações não salvas';
  if (hasUnpublishedChanges) return 'Há alterações não publicadas';
  return 'Publicado e atualizado';
}

export function EditorToolbar({
  status,
  isDirty,
  hasUnpublishedChanges,
  canPublish,
  isSaving,
  isPublishing,
  onSave,
  onPublish,
  onUnpublish,
}: EditorToolbarProps) {
  const isPublished = status === 'PUBLISHED';

  return (
    <Toolbar
      label="Ações do editor"
      dividers={['bottom']}
      startContent={
        <HStack gap={2} vAlign="center">
          <Badge
            variant={isPublished ? 'success' : 'neutral'}
            label={isPublished ? 'Publicado' : 'Rascunho'}
          />
          <Text type="supporting">{stateHint(isDirty, hasUnpublishedChanges)}</Text>
        </HStack>
      }
      endContent={
        <>
          <Button
            label="Salvar"
            variant={isDirty ? 'primary' : 'secondary'}
            icon={<Icon icon={Save} />}
            isLoading={isSaving}
            isDisabled={!isDirty}
            tooltip={isDirty ? undefined : 'O rascunho já está salvo.'}
            onClick={onSave}
          />
          {isPublished ? (
            <Button
              label="Despublicar"
              icon={<Icon icon={XCircle} />}
              isLoading={isPublishing}
              isDisabled={!canPublish}
              tooltip={canPublish ? undefined : NO_PUBLISH_PERMISSION}
              onClick={onUnpublish}
            />
          ) : null}
          <Button
            label="Publicar"
            variant={!isDirty && hasUnpublishedChanges ? 'primary' : 'secondary'}
            icon={<Icon icon={UploadCloud} />}
            isLoading={isPublishing}
            isDisabled={!canPublish}
            tooltip={canPublish ? undefined : NO_PUBLISH_PERMISSION}
            onClick={onPublish}
          />
        </>
      }
    />
  );
}
