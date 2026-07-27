import { useMemo, useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Stack, StackItem, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { TreeList } from '@astryxdesign/core/TreeList';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { countTables, filterSchemas } from '../lib/schema-search';
import type { DatabaseSchema, TableRef } from './db-schema-explorer-types';
import { SchemaExplorerToolbar } from './schema-explorer-toolbar';
import { buildSchemaTreeItems } from './schema-tree-items';

/**
 * Navegador de schema: controles fixos no topo, árvore rolável embaixo.
 *
 * PRESENTACIONAL — recebe dados e estados prontos; quem busca é a página. É o
 * que deixa os quatro estados (carregando, erro, vazio, cheio) testáveis sem
 * rede.
 *
 * A árvore é o `TreeList` do DS: ele já traz o modelo de teclado do APG (setas
 * para navegar, Enter/Espaço para ativar, chevron para expandir) e roving
 * tabindex. "Expandir/Recolher tudo" remonta a árvore via `key` porque a
 * expansão é estado interno do componente, semeado pelos dados.
 */
export interface DbSchemaExplorerProps {
  database: DatabaseSchema | null;
  isLoading: boolean;
  error: unknown;
  isRefreshing: boolean;
  onRetry: () => void;
  selected: TableRef | null;
  onSelect: (ref: TableRef) => void;
  /** Aviso de introspecção limitada (banco grande). */
  truncatedNotice?: string | null;
}

export function DbSchemaExplorer({
  database,
  isLoading,
  error,
  isRefreshing,
  onRetry,
  selected,
  onSelect,
  truncatedNotice,
}: DbSchemaExplorerProps) {
  const [search, setSearch] = useState('');
  const [onlyWithForeignKeys, setOnlyWithForeignKeys] = useState(false);
  const [expansion, setExpansion] = useState({ isOpen: true, seed: 0 });

  // O `?? []` cria um array novo a cada render; memorizar aqui evita que o
  // filtro (e a árvore inteira) seja remontado quando nada mudou.
  const schemas = useMemo(() => database?.schemas ?? [], [database]);
  const visibleSchemas = useMemo(
    () => filterSchemas(schemas, { search, onlyWithForeignKeys }),
    [schemas, search, onlyWithForeignKeys],
  );
  const items = useMemo(
    () =>
      buildSchemaTreeItems({
        schemas: visibleSchemas,
        selected,
        isExpanded: expansion.isOpen || search.trim().length > 0,
        onSelect,
      }),
    [visibleSchemas, selected, expansion.isOpen, search, onSelect],
  );

  const hasSchemas = schemas.length > 0;

  return (
    <Stack direction="vertical" height="100%">
      <SchemaExplorerToolbar
        search={search}
        onSearchChange={setSearch}
        onlyWithForeignKeys={onlyWithForeignKeys}
        onOnlyWithForeignKeysChange={setOnlyWithForeignKeys}
        onExpandAll={() =>
          setExpansion((current) => ({ isOpen: true, seed: current.seed + 1 }))
        }
        onCollapseAll={() =>
          setExpansion((current) => ({ isOpen: false, seed: current.seed + 1 }))
        }
        isDisabled={!hasSchemas}
      />
      <Divider />
      <StackItem size="fill" isScrollable>
        <VStack gap={2} padding={2}>
          {truncatedNotice ? (
            <Banner
              status="warning"
              container="card"
              title="Banco grande"
              description={truncatedNotice}
            />
          ) : null}

          {isLoading ? (
            <VStack gap={1} aria-busy="true">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} index={index} width="100%" height={28} radius={1} />
              ))}
            </VStack>
          ) : error ? (
            <Banner
              status="error"
              container="card"
              title="Não foi possível ler o schema"
              description={getApiErrorMessage(
                error,
                'Verifique a conectividade da conexão e tente novamente.',
              )}
              endContent={
                <Button
                  label="Tentar novamente"
                  size="sm"
                  isLoading={isRefreshing}
                  onClick={onRetry}
                />
              }
            />
          ) : !hasSchemas ? (
            <EmptyState
              headingLevel={3}
              title="Nenhuma tabela encontrada"
              description="A introspecção não retornou tabelas para esta conexão."
              actions={
                <Button
                  label="Atualizar schema"
                  size="sm"
                  isLoading={isRefreshing}
                  onClick={onRetry}
                />
              }
            />
          ) : visibleSchemas.length === 0 ? (
            <EmptyState
              isCompact
              headingLevel={3}
              title="Nada corresponde ao filtro"
              description="Ajuste a busca ou desmarque “Só com FK”."
              actions={
                <Button
                  label="Limpar filtros"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setOnlyWithForeignKeys(false);
                  }}
                />
              }
            />
          ) : (
            <TreeList
              key={expansion.seed}
              items={items}
              density="compact"
              header={
                <Text type="label" color="secondary">
                  {countTables(visibleSchemas)} tabela(s)
                </Text>
              }
            />
          )}
        </VStack>
      </StackItem>
    </Stack>
  );
}
