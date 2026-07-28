/**
 * Listagem de dashboards em LINHAS (não em cards).
 *
 * Dado denso e homogêneo (título, status, visibilidade, departamento, data)
 * escaneia melhor em tabela: as colunas alinham entre linhas e o olho compara
 * na vertical. Cards só se justificariam numa grade de miniaturas.
 *
 * Componente de apresentação puro: recebe linhas prontas (inclusive as ações já
 * resolvidas por RBAC) e não conhece rota, query ou permissão.
 */
import { Table, pixel, proportional, type TableColumn } from '@astryxdesign/core/Table';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { MoreMenu } from '@astryxdesign/core/MoreMenu';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import type { DropdownMenuOption } from '@astryxdesign/core/DropdownMenu';
import type { ArtifactStatus, ArtifactVisibility } from '../types';

const VISIBILITY_LABEL: Record<ArtifactVisibility, string> = {
  PRIVATE: 'Privado',
  DEPARTMENT: 'Departamento',
  ORG: 'Organização',
};

/** Linha da tabela: já normalizada pela página (sem entidade de domínio crua). */
export interface DashboardRow extends Record<string, unknown> {
  id: string;
  title: string;
  href: string;
  status: ArtifactStatus;
  visibility: ArtifactVisibility;
  /** Nome do departamento, ou `null` quando não há. */
  department: string | null;
  updatedAt: string;
  isMine: boolean;
  actions: DropdownMenuOption[];
  onPrefetch: () => void;
}

export interface DashboardsTableProps {
  rows: DashboardRow[];
}

const columns: TableColumn<DashboardRow>[] = [
  {
    key: 'title',
    header: 'Dashboard',
    width: proportional(2),
    renderCell: (row) => (
      <VStack gap={0.5}>
        <Link
          href={row.href}
          isStandalone
          weight="medium"
          maxLines={1}
          onMouseEnter={row.onPrefetch}
          onFocus={row.onPrefetch}
        >
          {row.title}
        </Link>
        {row.isMine ? <Text type="supporting">Meu dashboard</Text> : null}
      </VStack>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: pixel(140),
    renderCell: (row) => {
      const isPublished = row.status === 'PUBLISHED';
      const label = isPublished ? 'Publicado' : 'Rascunho';
      return (
        <HStack gap={1.5} vAlign="center">
          <StatusDot variant={isPublished ? 'success' : 'neutral'} label={label} />
          <Text type="supporting">{label}</Text>
        </HStack>
      );
    },
  },
  {
    key: 'visibility',
    header: 'Visibilidade',
    width: pixel(150),
    renderCell: (row) => (
      <Text type="supporting">{VISIBILITY_LABEL[row.visibility]}</Text>
    ),
  },
  {
    key: 'department',
    header: 'Departamento',
    width: proportional(1),
    renderCell: (row) => (
      <Text type="supporting" maxLines={1}>
        {row.department ?? '—'}
      </Text>
    ),
  },
  {
    key: 'updatedAt',
    header: 'Atualizado',
    width: pixel(170),
    renderCell: (row) => <Timestamp value={row.updatedAt} format="date_time" />,
  },
  {
    key: 'actions',
    header: '',
    width: pixel(56),
    align: 'end',
    renderCell: (row) =>
      row.actions.length > 0 ? (
        <MoreMenu label={`Ações de ${row.title}`} size="sm" items={row.actions} />
      ) : null,
  },
];

export function DashboardsTable({ rows }: DashboardsTableProps) {
  return (
    <Table
      aria-label="Dashboards"
      data={rows}
      columns={columns}
      idKey="id"
      density="compact"
      dividers="rows"
      hasHover
      textOverflow="truncate"
    />
  );
}

/** Esqueleto com a MESMA silhueta da tabela (nunca uma tela em branco). */
export function DashboardsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <VStack gap={2} aria-busy="true" aria-label="Carregando dashboards">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} height={40} index={index} />
      ))}
    </VStack>
  );
}
