/**
 * Barra de ações da tela de um gráfico: trilha de navegação + título à
 * esquerda, ações à direita.
 *
 * "Salvar" e "Publicar" só aparecem para quem pode; quando aparecem e não podem
 * ser executadas AGORA (nada mudou, título vazio, request em voo), ficam
 * desabilitadas com o motivo no tooltip — em vez de sumir e deixar o usuário
 * procurando.
 */
import { RefreshCw, Save, Send } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core/Breadcrumbs';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Heading } from '@astryxdesign/core/Text';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import type { ArtifactStatus } from '../types';

export interface ChartDetailToolbarProps {
  title: string;
  status: ArtifactStatus;
  canEdit: boolean;
  canPublish: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  isFetchingData: boolean;
  /** Quando presente, "Salvar" fica desabilitado com este motivo. */
  saveBlockedReason?: string;
  onSave: () => void;
  onPublish: () => void;
  onRefreshData: () => void;
}

export function ChartDetailToolbar({
  title,
  status,
  canEdit,
  canPublish,
  isSaving,
  isPublishing,
  isFetchingData,
  saveBlockedReason,
  onSave,
  onPublish,
  onRefreshData,
}: ChartDetailToolbarProps) {
  const isPublished = status === 'PUBLISHED';

  return (
    <Toolbar
      label="Ações do gráfico"
      startContent={
        <VStack gap={1}>
          <Breadcrumbs variant="supporting">
            <BreadcrumbItem href="/charts">Gráficos</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{title}</BreadcrumbItem>
          </Breadcrumbs>
          <HStack gap={2} vAlign="center" wrap="wrap">
            <Heading level={2} maxLines={1}>
              {title}
            </Heading>
            <Badge
              variant={isPublished ? 'success' : 'neutral'}
              label={isPublished ? 'Publicado' : 'Rascunho'}
            />
          </HStack>
        </VStack>
      }
      endContent={
        <HStack gap={2} vAlign="center">
          <Button
            label="Atualizar dados"
            icon={<Icon icon={RefreshCw} />}
            isLoading={isFetchingData}
            isDisabled={isFetchingData}
            tooltip={
              isFetchingData
                ? 'A query já está rodando'
                : 'Re-executa a query e atualiza o preview'
            }
            onClick={onRefreshData}
          />
          {canEdit ? (
            <Button
              label="Salvar"
              variant="primary"
              icon={<Icon icon={Save} />}
              isLoading={isSaving}
              isDisabled={Boolean(saveBlockedReason) || isSaving}
              tooltip={
                saveBlockedReason ?? 'Salva título, propriedades e query no rascunho'
              }
              onClick={onSave}
            />
          ) : null}
          {canPublish ? (
            <Button
              label={isPublished ? 'Republicar' : 'Publicar'}
              icon={<Icon icon={Send} />}
              isLoading={isPublishing}
              isDisabled={isPublishing}
              tooltip="Promove o rascunho atual para a versão publicada"
              onClick={onPublish}
            />
          ) : null}
        </HStack>
      }
    />
  );
}
