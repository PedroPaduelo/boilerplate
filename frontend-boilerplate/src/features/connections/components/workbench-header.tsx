import {
  ArrowLeft,
  Database,
  Pencil,
  PlugZap,
  RefreshCw,
  Terminal,
  Trash2,
} from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { LayoutHeader } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { Heading, Text } from '@astryxdesign/core/Text';
import { shortServerVersion } from '../lib/schema-mapper';
import { environmentView, formatBytes } from '../lib/connection-presentation';
import type { Connection, ConnectionSchema } from '../types';

/**
 * Cabeçalho do workbench: identidade da conexão à esquerda, ações à direita.
 *
 * Ações que dependem de conectividade (testar, executar query) ficam
 * DESABILITADAS com motivo quando a conexão está inativa — melhor barrar com
 * explicação do que deixar clicar e devolver erro do servidor.
 */
export interface WorkbenchHeaderProps {
  connection: Connection;
  schema?: ConnectionSchema;
  canManage: boolean;
  isTesting: boolean;
  isRefreshing: boolean;
  /** Sem tabela selecionada (ou conexão inativa) não há editor para abrir. */
  isQueryDisabled?: boolean;
  queryDisabledReason?: string;
  onTest: () => void;
  onRefresh: () => void;
  onOpenQueryRunner: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function WorkbenchHeader({
  connection,
  schema,
  canManage,
  isTesting,
  isRefreshing,
  isQueryDisabled,
  queryDisabledReason,
  onTest,
  onRefresh,
  onOpenQueryRunner,
  onEdit,
  onDelete,
}: WorkbenchHeaderProps) {
  const inactiveReason = connection.isActive
    ? undefined
    : 'Conexão inativa — reative para usar.';
  const version = shortServerVersion(schema?.database?.version);
  const size = formatBytes(schema?.database?.sizeBytes);
  // Ambiente DECLARADO no cadastro. Fica na identidade (e não só na lista de
  // conexões) porque é aqui que se consulta: "Produção" em vermelho é o aviso
  // de cuidado no momento em que ele importa.
  const environment = environmentView(connection.environment);

  return (
    <LayoutHeader hasDivider padding={2} label="Ações da conexão">
      <HStack gap={3} vAlign="center" justify="between" wrap="wrap">
        <HStack gap={2} vAlign="center">
          <Link
            href="/connections"
            label="Voltar para conexões"
            tooltip="Voltar para conexões"
          >
            <Icon icon={ArrowLeft} />
          </Link>
          <Icon icon={Database} color="accent" />
          <VStack gap={0}>
            <Heading level={2} maxLines={1}>
              {connection.name}
            </Heading>
            <Text type="code" size="sm" color="secondary" maxLines={1}>
              {connection.host}:{connection.port}/{connection.database}
            </Text>
          </VStack>
          <Badge variant={environment.variant} label={environment.label} />
          <Badge
            variant="info"
            label={version ? `PostgreSQL ${version}` : 'PostgreSQL'}
          />
          {schema ? (
            <Badge variant="neutral" label={`${schema.tableCount} tabelas · ${size}`} />
          ) : null}
        </HStack>

        <HStack gap={1} vAlign="center" wrap="wrap">
          <Button
            label="Testar"
            size="sm"
            icon={<Icon icon={PlugZap} />}
            isLoading={isTesting}
            isDisabled={!connection.isActive}
            tooltip={inactiveReason ?? 'Verifica a conectividade agora'}
            onClick={onTest}
          />
          <Button
            label="Atualizar schema"
            size="sm"
            icon={<Icon icon={RefreshCw} />}
            isLoading={isRefreshing}
            onClick={onRefresh}
          />
          <Button
            label="Query"
            size="sm"
            variant="primary"
            icon={<Icon icon={Terminal} />}
            isDisabled={isQueryDisabled ?? !connection.isActive}
            tooltip={
              queryDisabledReason ?? inactiveReason ?? 'Abrir o editor de consulta'
            }
            onClick={onOpenQueryRunner}
          />
          {canManage ? (
            <>
              <IconButton
                label="Editar conexão"
                tooltip="Editar conexão"
                size="sm"
                icon={<Icon icon={Pencil} />}
                onClick={onEdit}
              />
              <IconButton
                label="Excluir conexão"
                tooltip="Excluir conexão"
                size="sm"
                variant="ghost"
                icon={<Icon icon={Trash2} />}
                onClick={onDelete}
              />
            </>
          ) : null}
        </HStack>
      </HStack>
    </LayoutHeader>
  );
}
