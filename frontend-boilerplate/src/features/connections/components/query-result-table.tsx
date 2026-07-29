import { useMemo, useState } from 'react';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import {
  Table,
  pixel,
  useTablePagination,
  useTableSortable,
  useTableSortableState,
  type TableColumn,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import type { QueryResult } from '../types';

/**
 * Resultado do SELECT em tabela densa, com ORDENAÇÃO por cabeçalho e
 * PAGINAÇÃO — ambas via plugins do próprio DS (`useTableSortable` +
 * `useTablePagination`), o mesmo par que a `ConnectionsTable` usa.
 *
 * A paginação usa a variante `count` ("1–10 de 100") com seletor de linhas
 * por página, o padrão dos clientes SQL: a contagem responde "quantas linhas
 * vieram e onde estou" de relance — coisa que os botões numerados da variante
 * `pages` não dizem — e o seletor deixa o usuário trocar densidade por
 * varredura (10 para ler, 100 para varrer) sem reexecutar a query. Some
 * sozinha quando o resultado cabe numa página.
 *
 * Saiu do modo `children` para o modo declarativo (`columns`): os plugins de
 * ordenação/paginação trabalham sobre `data`, e no modo children não haveria
 * o que ordenar. As colunas são construídas em runtime a partir do próprio
 * resultado — não dá para declará-las, dependem da query.
 *
 * Largura fixa por coluna (e não proporcional) porque um resultado pode ter 20
 * colunas: proporcional espremeria todas até o ilegível. Com largura fixa a
 * tabela rola na horizontal, que é o comportamento de qualquer cliente SQL.
 */

/** Linhas por página ao abrir o resultado — o seletor permite subir. */
const DEFAULT_PAGE_SIZE = 10;
/** Opções do seletor de linhas por página (100 = teto do preview). */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
/** Largura de coluna: cabe um uuid inteiro sem truncar. */
const COLUMN_WIDTH = 200;

type ResultRow = Record<string, unknown>;

/** `null` vira ∅ (e não string vazia) para distinguir de texto em branco. */
function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '∅';
  return String(value);
}

/**
 * Normaliza o valor para ORDENAR corretamente: número continua número (senão
 * 10 viria antes de 9), objeto/array viram JSON, o resto vira o valor cru.
 */
function toSortableValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

export function QueryResultTable({ result }: { result: QueryResult }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Chave de identidade da linha. O resultado pode ter uma coluna chamada
  // "__row", então a chave é ajustada até não colidir com nenhuma coluna real.
  const idKey = useMemo(() => {
    const names = new Set(result.columns.map((column) => column.name));
    let key = '__row';
    while (names.has(key)) key += '_';
    return key;
  }, [result.columns]);

  const rows = useMemo<ResultRow[]>(
    () =>
      result.rows.map((row, index) => {
        const normalized: ResultRow = { [idKey]: index };
        for (const column of result.columns) {
          normalized[column.name] = toSortableValue(row[column.name]);
        }
        return normalized;
      }),
    [result.rows, result.columns, idKey],
  );

  const columns = useMemo<TableColumn<ResultRow>[]>(
    () =>
      result.columns.map((column) => ({
        key: column.name,
        header: column.name,
        width: pixel(COLUMN_WIDTH),
        sortable: true,
        renderCell: (row: ResultRow) => (
          <Text type="code" maxLines={1} hasTruncateTooltip>
            {formatCell(row[column.name])}
          </Text>
        ),
      })),
    [result.columns],
  );

  const { sortedData, sortConfig } = useTableSortableState<ResultRow>({
    data: rows,
    defaultSort: [],
  });
  const sortable = useTableSortable<ResultRow>(sortConfig);

  // Nova execução → volta para a primeira página; sem isto o usuário cairia
  // numa página vazia ao rodar uma query que devolve menos linhas.
  //
  // Ajuste DURANTE O RENDER (padrão "adjusting state when a prop changes" do
  // react.dev), e não em `useEffect`: o efeito só rodaria depois de pintar a
  // página errada, causando o render em cascata que o lint acusa.
  const [lastResult, setLastResult] = useState(result);
  if (lastResult !== result) {
    setLastResult(result);
    setPage(1);
  }

  const pagination = useTablePagination<ResultRow>({
    page,
    onPageChange: setPage,
    totalItems: sortedData.length,
    pageSize,
    // Trocar o tamanho reinicia na primeira página: manter a página atual
    // poderia deixar o usuário além da última página do novo tamanho.
    onPageSizeChange: (size) => {
      setPageSize(size);
      setPage(1);
    },
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    variant: 'count',
    size: 'sm',
    align: 'end',
    label: 'Paginação do resultado',
  });

  const pageData = useMemo(
    () => sortedData.slice((page - 1) * pageSize, page * pageSize),
    [sortedData, page, pageSize],
  );

  if (result.rows.length === 0) {
    return (
      <EmptyState
        isCompact
        headingLevel={3}
        title="Nenhuma linha retornada"
        description="A query executou sem erro, mas o filtro não encontrou registros."
      />
    );
  }

  return (
    <Table<ResultRow>
      data={pageData}
      columns={columns}
      idKey={idKey}
      density="compact"
      dividers="grid"
      isStriped
      hasHover
      textOverflow="truncate"
      plugins={{ sortable, pagination }}
    />
  );
}
