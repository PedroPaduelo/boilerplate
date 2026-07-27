/**
 * Bloco `data_table` (shape 'table') — tabela rica: busca, ordenação e
 * paginação com o `Table` do Astryx e seus plugins headless.
 *
 * As três capacidades deixam de ser código do bloco e viram plugins do DS:
 *  - ORDENAÇÃO — `useTableSortableState` (estado + ordenação local, com
 *    comparadores por tipo) + `useTableSortable` (cabeçalhos clicáveis);
 *  - PAGINAÇÃO — `useTablePagination` (controles no rodapé) + `paginateData`;
 *  - BUSCA     — um `TextInput` controlado que filtra pelo valor EXIBIDO.
 *
 * A SELEÇÃO de linhas (`useTableSelection`) existe no DS mas NÃO foi ligada:
 * o bloco é de leitura e não tem ação em lote — checkbox sem destino seria UI
 * morta. Está a um hook de distância quando houver ação.
 */
import { useMemo, useState } from 'react';
import type { TableData } from '@dashboards/contracts';
import { Search } from 'lucide-react';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/HStack';
import {
  Table,
  paginateData,
  useTablePagination,
  useTableSortable,
  useTableSortableState,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import {
  buildColumns,
  buildComparators,
  filterRows,
  type ColumnSpec,
  type Row,
} from './columns';

type DataTableProps = {
  pageSize?: number;
  filterPlaceholder?: string;
};

export const Component: BlockComponent<DataTableProps, TableData> = ({ props, data }) => {
  // Memoizados porque alimentam os `useMemo` abaixo: `?? []` cria um array novo
  // a cada render e invalidaria a filtragem/ordenação sem nenhum dado ter mudado.
  const specs = useMemo(() => (data?.columns ?? []) as ColumnSpec[], [data?.columns]);
  const rows = useMemo(() => (data?.rows ?? []) as Row[], [data?.rows]);
  const pageSize = props.pageSize ?? 5;

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const columns = useMemo(() => buildColumns(specs), [specs]);
  const comparators = useMemo(() => buildComparators(specs), [specs]);
  const filtered = useMemo(() => filterRows(rows, specs, query), [rows, specs, query]);

  const { sortedData, sortConfig } = useTableSortableState<Row>({
    data: filtered,
    comparators,
  });
  const sortPlugin = useTableSortable<Row>(sortConfig);
  const paginationPlugin = useTablePagination<Row>({
    page,
    onPageChange: setPage,
    totalItems: sortedData.length,
    pageSize,
    size: 'sm',
    align: 'end',
    label: 'Paginação da tabela',
  });

  const pageRows = paginateData(sortedData, page, pageSize);

  return (
    <VStack gap={3} data-slot="data-table">
      <HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
        <TextInput
          label="Filtrar registros"
          isLabelHidden
          size="sm"
          startIcon={Search}
          placeholder={props.filterPlaceholder ?? 'Filtrar…'}
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
        />
        <Text type="supporting" color="secondary" hasTabularNumbers>
          {sortedData.length} registro(s)
        </Text>
      </HStack>

      <Table<Row>
        data={pageRows}
        columns={columns}
        plugins={{ sort: sortPlugin, pagination: paginationPlugin }}
        density="compact"
        hasHover
        textOverflow="truncate"
        emptyState={
          <EmptyState
            isCompact
            title="Nenhum resultado encontrado."
            description={
              query.trim() === ''
                ? 'A consulta deste bloco não retornou linhas.'
                : 'Ajuste o filtro para ver outros registros.'
            }
            data-slot="data-table-empty"
          />
        }
      />
    </VStack>
  );
};

export const definition = defineBlock<DataTableProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
