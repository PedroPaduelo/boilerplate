/**
 * Tabela de gráficos — a listagem é DENSA (título, tipo, status, visibilidade,
 * departamento, data e ações), então é linha, não card: cada coluna alinha
 * entre as linhas e o olho compara na vertical.
 *
 * O título é um `Link` (navegação client-side pelo `LinkProvider` do shell) e
 * dispara o prefetch do detalhe no hover/foco — abrir fica instantâneo.
 */
import { MoreMenu } from '@astryxdesign/core/MoreMenu';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Table, pixel, proportional } from '@astryxdesign/core/Table';
import type { TableColumn } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import type { DropdownMenuOption } from '@astryxdesign/core/DropdownMenu';
import type { Chart } from '../types';

/** Uma linha da tabela — o gráfico + os campos já formatados para exibição. */
export interface ChartRow extends Record<string, unknown> {
  id: string;
  chart: Chart;
  title: string;
  catalogType: string;
  isPublished: boolean;
  visibility: string;
  context: string;
  updatedAt: string;
  actions: DropdownMenuOption[];
}

export interface ChartsTableProps {
  rows: ChartRow[];
  onPrefetch: (id: string) => void;
}

const VISIBILITY_LABEL: Record<string, string> = {
  PRIVATE: 'Privado',
  DEPARTMENT: 'Departamento',
  ORG: 'Organização',
};

export function ChartsTable({ rows, onPrefetch }: ChartsTableProps) {
  const columns: TableColumn<ChartRow>[] = [
    {
      key: 'title',
      header: 'Gráfico',
      width: proportional(2),
      renderCell: (row) => (
        <VStack
          gap={0.5}
          onMouseEnter={() => onPrefetch(row.id)}
          onFocus={() => onPrefetch(row.id)}
        >
          <Link href={`/charts/${row.id}`} isStandalone weight="medium" maxLines={1}>
            {row.title}
          </Link>
          <Text type="supporting">{row.catalogType}</Text>
        </VStack>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: pixel(140),
      renderCell: (row) => (
        <HStack gap={1.5} vAlign="center">
          <StatusDot
            variant={row.isPublished ? 'success' : 'neutral'}
            label={row.isPublished ? 'Publicado' : 'Rascunho'}
          />
          <Text type="body">{row.isPublished ? 'Publicado' : 'Rascunho'}</Text>
        </HStack>
      ),
    },
    {
      key: 'visibility',
      header: 'Visibilidade',
      width: pixel(150),
      renderCell: (row) => (
        <Text type="body">{VISIBILITY_LABEL[row.visibility] ?? row.visibility}</Text>
      ),
    },
    {
      key: 'context',
      header: 'Contexto',
      width: proportional(1),
      renderCell: (row) => <Text type="supporting">{row.context}</Text>,
    },
    {
      key: 'updatedAt',
      header: 'Atualizado',
      width: pixel(170),
      renderCell: (row) => <Timestamp value={row.updatedAt} format="auto" />,
    },
    {
      key: 'actions',
      header: '',
      width: pixel(64),
      align: 'end',
      resizable: false,
      renderCell: (row) => (
        <MoreMenu label={`Ações de ${row.title}`} size="sm" items={row.actions} />
      ),
    },
  ];

  return (
    <Table
      data={rows}
      columns={columns}
      idKey="id"
      density="compact"
      hasHover
      textOverflow="truncate"
    />
  );
}
