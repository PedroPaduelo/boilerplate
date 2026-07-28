import { useState } from 'react';
import { Star, StarOff, Table2, Terminal } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Heading, Text } from '@astryxdesign/core/Text';
import { formatCount, formatSizeMB } from '../lib/connection-presentation';
import { buildSelectPreview } from '../lib/ddl';
import type { DbEngine, TableDef, TableRef } from './db-schema-explorer-types';
import { TableColumnsTable } from './table-columns-table';
import { TableDdlPanel } from './table-ddl-panel';
import { TableForeignKeysTable } from './table-foreign-keys-table';
import { TableIndexesTable } from './table-indexes-table';
import { TablePreviewPanel } from './table-preview-panel';

/**
 * Inspetor da tabela selecionada: identidade + métricas no topo, detalhe em
 * abas.
 *
 * A ordem das abas segue as personas da tela: **Dados** primeiro (a pergunta
 * do auditor não técnico — "o que tem aqui dentro?" — respondida sem SQL),
 * depois a anatomia em profundidade crescente de tecnicidade: Colunas,
 * Relações, Índices e DDL. "Relações" em vez de "Foreign keys" no rótulo:
 * quem é técnico entende os dois; quem não é, só o primeiro.
 */
export type TableDetailTab = 'data' | 'columns' | 'indexes' | 'fks' | 'ddl';

export interface TableInfoPanelProps {
  /** Conexão dona da tabela — a aba Dados consulta a amostra por ela. */
  connectionId: string;
  table: TableDef | null;
  engine: DbEngine;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onNavigateFk: (ref: TableRef) => void;
  onPreviewQuery: (sql: string) => void;
  /** Bloqueia consultas quando a conexão está inativa. */
  isQueryDisabled?: boolean;
  queryDisabledReason?: string;
}

export function TableInfoPanel({
  connectionId,
  table,
  engine,
  isFavorite,
  onToggleFavorite,
  onNavigateFk,
  onPreviewQuery,
  isQueryDisabled,
  queryDisabledReason,
}: TableInfoPanelProps) {
  const [tab, setTab] = useState<TableDetailTab>('data');

  if (!table) {
    return (
      <Center height="100%">
        <EmptyState
          headingLevel={3}
          icon={<Icon icon={Table2} size="lg" color="secondary" />}
          title="Nenhuma tabela selecionada"
          description="Escolha uma tabela na árvore à esquerda para ver os dados, colunas, relações e índices."
        />
      </Center>
    );
  }

  return (
    <VStack gap={3}>
      <HStack gap={3} justify="between" align="start" wrap="wrap">
        <VStack gap={1}>
          <Text type="supporting" color="secondary">
            {table.schema}
          </Text>
          <Heading level={3} maxLines={1}>
            {table.name}
          </Heading>
          {table.description ? (
            <Text color="secondary" maxLines={2}>
              {table.description}
            </Text>
          ) : null}
          <HStack gap={1} wrap="wrap" vAlign="center">
            <Badge variant="neutral" label={`${table.columns.length} colunas`} />
            <Badge variant="neutral" label={`${table.indexes.length} índices`} />
            <Badge variant="neutral" label={`${table.foreignKeys.length} FK`} />
            <Badge variant="neutral" label={`${formatCount(table.rowCount)} linhas`} />
            <Badge variant="neutral" label={formatSizeMB(table.sizeMB)} />
          </HStack>
        </VStack>

        <HStack gap={1} vAlign="center" wrap="wrap">
          <Button
            label={isFavorite ? 'Remover dos favoritos' : 'Favoritar tabela'}
            size="sm"
            icon={<Icon icon={isFavorite ? StarOff : Star} />}
            onClick={onToggleFavorite}
          />
          <Button
            label="Consultar"
            size="sm"
            variant="primary"
            icon={<Icon icon={Terminal} />}
            isDisabled={isQueryDisabled}
            tooltip={queryDisabledReason ?? 'Abre o executor com um SELECT de amostra'}
            onClick={() => onPreviewQuery(buildSelectPreview(table.schema, table.name))}
          />
        </HStack>
      </HStack>

      <TabList
        value={tab}
        onChange={(value) => setTab(value as TableDetailTab)}
        hasDivider
      >
        <Tab value="data" label="Dados" />
        <Tab value="columns" label="Colunas" />
        <Tab value="fks" label="Relações" />
        <Tab value="indexes" label="Índices" />
        <Tab value="ddl" label="DDL" />
      </TabList>

      {tab === 'data' ? (
        <TablePreviewPanel
          // `key` remonta o painel ao trocar de tabela: a amostra recarrega e
          // nenhum resultado da tabela anterior fica visível por engano.
          key={`${table.schema}.${table.name}`}
          connectionId={connectionId}
          schema={table.schema}
          table={table.name}
          isDisabled={isQueryDisabled}
          disabledReason={queryDisabledReason}
          onOpenSql={() => onPreviewQuery(buildSelectPreview(table.schema, table.name))}
        />
      ) : null}
      {tab === 'columns' ? <TableColumnsTable columns={table.columns} /> : null}
      {tab === 'indexes' ? <TableIndexesTable indexes={table.indexes} /> : null}
      {tab === 'fks' ? (
        <TableForeignKeysTable
          foreignKeys={table.foreignKeys}
          onNavigate={onNavigateFk}
        />
      ) : null}
      {tab === 'ddl' ? <TableDdlPanel table={table} engine={engine} /> : null}
    </VStack>
  );
}
