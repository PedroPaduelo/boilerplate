import { Copy } from 'lucide-react';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack } from '@astryxdesign/core/Layout';
import { LayoutFooter } from '@astryxdesign/core/Layout';
import { Spinner } from '@astryxdesign/core/Spinner';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { connectionStatusView } from '../lib/connection-presentation';
import { shortServerVersion } from '../lib/schema-mapper';
import type { Connection } from '../types';

/**
 * Barra de status do workbench (rodapé, estilo IDE): estado da conexão à
 * esquerda, atividade e escala do banco à direita. Faixa fina e densa — são
 * metadados de contexto, não conteúdo.
 */
export interface WorkbenchStatusBarProps {
  connection: Connection;
  visibleTables: number;
  isRunningQuery: boolean;
  lastDurationMs: number | null;
  serverVersion?: string | null;
}

export function WorkbenchStatusBar({
  connection,
  visibleTables,
  isRunningQuery,
  lastDurationMs,
  serverVersion,
}: WorkbenchStatusBarProps) {
  const toast = useAppToast();
  const status = connectionStatusView(connection.status);

  const copyVersion = async () => {
    if (!serverVersion) return;
    try {
      await navigator.clipboard?.writeText(serverVersion);
      toast.success('Versão do servidor copiada.');
    } catch {
      toast.error('Não foi possível copiar a versão.');
    }
  };

  return (
    <LayoutFooter hasDivider padding={1} label="Status da conexão">
      <HStack gap={3} vAlign="center" justify="between" wrap="wrap">
        <HStack gap={3} vAlign="center">
          <HStack gap={1} vAlign="center">
            <StatusDot variant={status.variant} label={status.label} />
            <Text type="supporting" color="secondary">
              {status.label}
            </Text>
          </HStack>
          <Text type="supporting" color="secondary" maxLines={1}>
            {connection.database}
          </Text>
          <Text type="supporting" color="secondary">
            somente leitura
          </Text>
        </HStack>

        <HStack gap={3} vAlign="center">
          {isRunningQuery ? (
            <HStack gap={1} vAlign="center">
              <Spinner size="sm" label="Executando query" />
              <Text type="supporting" color="secondary">
                executando…
              </Text>
            </HStack>
          ) : (
            <Text type="supporting" color="secondary" hasTabularNumbers>
              {lastDurationMs === null ? 'ocioso' : `última query: ${lastDurationMs}ms`}
            </Text>
          )}
          <Text type="supporting" color="secondary" hasTabularNumbers>
            {visibleTables === 1
              ? '1 tabela visível'
              : `${visibleTables} tabelas visíveis`}
          </Text>
          {serverVersion ? (
            <HStack gap={1} vAlign="center">
              <Text type="supporting" color="secondary">
                {shortServerVersion(serverVersion)}
              </Text>
              <IconButton
                label="Copiar versão do servidor"
                tooltip={serverVersion}
                size="sm"
                variant="ghost"
                icon={<Icon icon={Copy} />}
                clickAction={copyVersion}
              />
            </HStack>
          ) : null}
        </HStack>
      </HStack>
    </LayoutFooter>
  );
}
