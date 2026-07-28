/**
 * Barra de ações do editor: estado da publicação à esquerda, ações à direita.
 *
 * FIXA NO TOPO (`.app-editor-toolbar`). No editor antigo ela rolava junto com a
 * página, então numa tela de 2557px de conteúdo o botão Salvar passava a maior
 * parte do tempo fora de vista — e o estado ("há alterações não salvas") junto
 * com ele. Estado que só existe quando ninguém está olhando não é estado, é
 * armadilha.
 *
 * Só UMA ação é primária por vez — enquanto há alterações locais o destaque é
 * "Salvar"; quando o rascunho está salvo mas não publicado, o destaque passa a
 * "Publicar". Botão desabilitado sempre explica o motivo via tooltip, em vez de
 * sumir (o usuário precisa saber que a ação existe e por que não pode usá-la).
 */
import { Eye, Save, UploadCloud, XCircle } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import type { ArtifactStatus } from '../../types';

const NO_PUBLISH_PERMISSION =
  'Publicar exige ser dono do dashboard e ter permissão de publicação.';

export interface EditorToolbarProps {
  dashboardId: string;
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

/**
 * A frase de estado. O caso do dashboard NUNCA publicado tinha a frase errada:
 * "há alterações não publicadas" pressupõe uma publicação anterior — quem nunca
 * publicou lia aquilo como se tivesse esquecido de fazer algo que não existia.
 */
function stateHint(
  status: ArtifactStatus,
  isDirty: boolean,
  hasUnpublishedChanges: boolean,
): string {
  if (isDirty) return 'Alterações não salvas';
  if (status !== 'PUBLISHED') return 'Salvo — ainda não publicado';
  if (hasUnpublishedChanges) return 'Há alterações não publicadas';
  return 'Publicado e atualizado';
}

export function EditorToolbar({
  dashboardId,
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
    <VStack gap={0} className="app-editor-toolbar">
      <Toolbar
        label="Ações do editor"
        dividers={['bottom']}
        startContent={
          <HStack gap={2} vAlign="center">
            <Badge
              variant={isPublished ? 'success' : 'neutral'}
              label={isPublished ? 'Publicado' : 'Rascunho'}
            />
            <Text type="supporting">
              {stateHint(status, isDirty, hasUnpublishedChanges)}
            </Text>
          </HStack>
        }
        endContent={
          <>
            {/* Abre em outra guia: conferir o resultado não pode custar o
                trabalho em curso. */}
            <Button
              label="Ver dashboard"
              variant="ghost"
              icon={<Icon icon={Eye} />}
              tooltip="Abre o modo de leitura em uma nova guia"
              href={`/dashboards/${dashboardId}/view`}
              target="_blank"
              rel="noopener"
            />
            <Button
              label="Salvar"
              variant={isDirty ? 'primary' : 'secondary'}
              icon={<Icon icon={Save} />}
              isLoading={isSaving}
              isDisabled={!isDirty}
              tooltip={isDirty ? 'Salvar rascunho (⌘S)' : 'O rascunho já está salvo.'}
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
    </VStack>
  );
}
