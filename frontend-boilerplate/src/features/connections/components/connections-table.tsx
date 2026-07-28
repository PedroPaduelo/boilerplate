import { useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { MoreMenu } from '@astryxdesign/core/MoreMenu';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import {
  Table,
  pixel,
  proportional,
  useTableSortable,
  useTableSortableState,
  type TableColumn,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import {
  connectionStatusView,
  environmentView,
  visibilityLabel,
} from '../lib/connection-presentation';
import type { Connection } from '../types';

/**
 * Lista de conexões em TABELA densa — sucessora do grid de tiles legado
 * (`db-overview-grid`), que gastava um card gigante por conexão para exibir
 * métricas de frota que esta API não fornece (QPS, cache hit, réplica). Aqui
 * cada linha é uma conexão com o que existe de verdade: status, endereço,
 * ambiente, visibilidade e último teste.
 */
export interface ConnectionsTableProps {
  connections: Connection[];
  canManage: boolean;
  onEdit: (connection: Connection) => void;
  onDelete: (connection: Connection) => void;
}

/** Linha achatada: o `Table` do DS ordena por valor simples da linha. */
type ConnectionRow = {
  id: string;
  name: string;
  status: string;
  endpoint: string;
  environment: string;
  visibility: string;
  lastTestedAt: string;
  connection: Connection;
};

export function ConnectionsTable({
  connections,
  canManage,
  onEdit,
  onDelete,
}: ConnectionsTableProps) {
  const rows = useMemo<ConnectionRow[]>(
    () =>
      connections.map((connection) => ({
        id: connection.id,
        name: connection.name,
        status: connectionStatusView(connection.status).label,
        endpoint: `${connection.host}:${connection.port}/${connection.database}`,
        environment: environmentView(connection.environment).label,
        visibility: visibilityLabel(connection.visibility),
        lastTestedAt: connection.lastTestedAt ?? '',
        connection,
      })),
    [connections],
  );

  const { sortedData, sortConfig } = useTableSortableState<ConnectionRow>({
    data: rows,
    defaultSort: [{ sortKey: 'name', direction: 'ascending' }],
  });
  const sortable = useTableSortable<ConnectionRow>(sortConfig);

  const columns = useMemo<TableColumn<ConnectionRow>[]>(() => {
    const base: TableColumn<ConnectionRow>[] = [
      {
        key: 'name',
        header: 'Conexão',
        width: proportional(2),
        sortable: true,
        renderCell: (row) => (
          <VStack gap={0}>
            <Link
              href={`/connections/${row.id}`}
              isStandalone
              weight="medium"
              maxLines={1}
            >
              {row.name}
            </Link>
            {row.connection.description ? (
              <Text type="supporting" color="secondary" maxLines={1}>
                {row.connection.description}
              </Text>
            ) : null}
          </VStack>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: pixel(140),
        sortable: true,
        renderCell: (row) => {
          const status = connectionStatusView(row.connection.status);
          return (
            <HStack gap={1} vAlign="center">
              <StatusDot variant={status.variant} label={status.label} />
              <Text type="supporting">{status.label}</Text>
            </HStack>
          );
        },
      },
      {
        key: 'endpoint',
        header: 'Endereço',
        width: proportional(2),
        renderCell: (row) => (
          <Text type="code" color="secondary" maxLines={1} hasTruncateTooltip>
            {row.endpoint}
          </Text>
        ),
      },
      {
        key: 'environment',
        header: 'Ambiente',
        width: pixel(130),
        renderCell: (row) => {
          const environment = environmentView(row.connection.environment);
          return <Badge variant={environment.variant} label={environment.label} />;
        },
      },
      {
        key: 'visibility',
        header: 'Visibilidade',
        width: pixel(140),
        renderCell: (row) => <Text type="supporting">{row.visibility}</Text>,
      },
      {
        key: 'lastTestedAt',
        header: 'Último teste',
        width: pixel(150),
        sortable: true,
        renderCell: (row) =>
          row.lastTestedAt ? (
            <Timestamp value={row.lastTestedAt} format="relative" type="supporting" />
          ) : (
            <Text type="supporting" color="secondary">
              Nunca testada
            </Text>
          ),
      },
    ];

    if (!canManage) return base;

    return [
      ...base,
      {
        key: 'actions',
        header: 'Ações',
        width: pixel(72),
        align: 'end',
        renderCell: (row) => (
          <MoreMenu
            label={`Ações de ${row.name}`}
            size="sm"
            items={[
              {
                label: 'Editar conexão',
                icon: Pencil,
                onClick: () => onEdit(row.connection),
              },
              {
                label: 'Excluir conexão',
                icon: Trash2,
                onClick: () => onDelete(row.connection),
              },
            ]}
          />
        ),
      },
    ];
  }, [canManage, onEdit, onDelete]);

  return (
    <Table<ConnectionRow>
      data={sortedData}
      columns={columns}
      idKey="id"
      density="compact"
      dividers="rows"
      hasHover
      textOverflow="truncate"
      plugins={{ sortable }}
    />
  );
}
