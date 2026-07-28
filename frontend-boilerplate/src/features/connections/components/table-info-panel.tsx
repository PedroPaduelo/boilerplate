import { Star, StarOff, Table2, Terminal } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Heading, Text } from '@astryxdesign/core/Text';
import { formatCount, formatSizeMB } from '../lib/connection-presentation';
import type { QueryResult } from '../types';
import type { DbEngine, TableDef, TableRef } from './db-schema-explorer-types';
import { TableColumnsTable } from './table-columns-table';
import { TableDdlPanel } from './table-ddl-panel';
import { TableForeignKeysTable } from './table-foreign-keys-table';
import { TableIndexesTable } from './table-indexes-table';
import { TablePreviewPanel } from './table-preview-panel';

/**
 * Inspetor da tabela selecionada.
 *
 * HIERARQUIA (o que a tela quer que você leia primeiro):
 *   1. nome da tabela — `Heading`, o maior elemento da região;
 *   2. as duas métricas que dimensionam o objeto (linhas e tamanho) —
 *      `Badge` de destaque;
 *   3. a anatomia (colunas/índices/FKs) — texto de apoio, cinza, menor.
 *
 * Antes as cinco métricas eram cinco badges neutros idênticos: com tudo no
 * mesmo peso, nada se lia. Agora "3.7k linhas · 3.5 MB" salta e o resto recua,
 * até porque colunas/índices/FKs já aparecem contados nas próprias abas.
 *
 * Ordem das abas por persona: **Dados** primeiro (a pergunta do auditor não
 * técnico, respondida sem escrever SQL), depois profundidade técnica crescente
 * — Colunas, Relações, Índices, DDL. "Relações" em vez de "Foreign keys": quem
 * é técnico entende os dois; quem não é, só o primeiro.
 *
 * A aba ativa é CONTROLADA pela página: o botão "Query" do cabeçalho precisa
 * conseguir trazer o usuário para cá, e estado interno não permitiria isso.
 */
export type TableDetailTab = 'data' | 'columns' | 'indexes' | 'fks' | 'ddl';

export interface TableInfoPanelProps {
  table: TableDef | null;
  engine: DbEngine;
  tab: TableDetailTab;
  onTabChange: (tab: TableDetailTab) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onNavigateFk: (ref: TableRef) => void;
  /** Estado do editor de consulta (aba Dados). */
  sql: string;
  onSqlChange: (sql: string) => void;
  onRunQuery: () => void;
  isQueryPending: boolean;
  queryResult: QueryResult | null;
  queryErrorMessage: string | null;
  /** Leva o usuário para a aba Dados (botão "Consultar"). */
  onOpenQuery: () => void;
  isQueryDisabled?: boolean;
  queryDisabledReason?: string;
}

export function TableInfoPanel({
  table,
  engine,
  tab,
  onTabChange,
  isFavorite,
  onToggleFavorite,
  onNavigateFk,
  sql,
  onSqlChange,
  onRunQuery,
  isQueryPending,
  queryResult,
  queryErrorMessage,
  onOpenQuery,
  isQueryDisabled,
  queryDisabledReason,
}: TableInfoPanelProps) {
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
    <VStack gap={4}>
      {/* --------------------------- identidade --------------------------- */}
      <HStack gap={4} justify="between" align="start" wrap="wrap">
        <VStack gap={1.5}>
          <Text type="supporting" color="secondary">
            {table.schema}
          </Text>
          <Heading level={2} maxLines={1}>
            {table.name}
          </Heading>
          {table.description ? (
            <Text color="secondary" maxLines={2}>
              {table.description}
            </Text>
          ) : null}
          <HStack gap={2} wrap="wrap" vAlign="center">
            {/* Escala do objeto: o que decide se dá para varrer a tabela. */}
            <Badge variant="info" label={`${formatCount(table.rowCount)} linhas`} />
            <Badge variant="info" label={formatSizeMB(table.sizeMB)} />
            {/* Anatomia: apoio — as abas já mostram cada contagem. */}
            <Text type="supporting" color="secondary">
              {table.columns.length} colunas · {table.indexes.length} índices ·{' '}
              {table.foreignKeys.length} relações
            </Text>
          </HStack>
        </VStack>

        <HStack gap={2} vAlign="center" wrap="wrap">
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
            tooltip={queryDisabledReason ?? 'Abre o editor com um SELECT desta tabela'}
            onClick={onOpenQuery}
          />
        </HStack>
      </HStack>

      <Divider />

      <TabList value={tab} onChange={(value) => onTabChange(value as TableDetailTab)}>
        <Tab value="data" label="Dados" />
        <Tab value="columns" label="Colunas" />
        <Tab value="fks" label="Relações" />
        <Tab value="indexes" label="Índices" />
        <Tab value="ddl" label="DDL" />
      </TabList>

      {/* `paddingBlock` afasta o conteúdo da faixa de abas e da borda inferior
          da região — antes tabela e DDL encostavam direto na divisória. */}
      <VStack gap={2} paddingBlock={1}>
        {tab === 'data' ? (
          <TablePreviewPanel
            sql={sql}
            onSqlChange={onSqlChange}
            onRun={onRunQuery}
            isPending={isQueryPending}
            result={queryResult}
            errorMessage={queryErrorMessage}
            isDisabled={isQueryDisabled}
            disabledReason={queryDisabledReason}
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
    </VStack>
  );
}
