import { useState } from 'react';
import {
  Database,
  Search,
  SearchX,
  Plus,
  Pencil,
  Trash2,
  Table2,
  PlugZap,
} from 'lucide-react';

import {
  Badge,
  Button,
  Input,
  Skeleton,
  Section,
  SectionHeader,
  TableFluid,
  TableFluidHeader,
  TableFluidBody,
  TableFluidRow,
  TableFluidHead,
  TableFluidCell,
} from '@/components/ui';
import { cn, formatDateTime } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useAuthStore } from '@/features/auth/store';
import { hasPermission } from '@/shared/lib/rbac';

import { useConnections, useTestConnection } from '../hooks';
import type { Connection } from '../types';
import { ConnectionFormDialog } from './connection-form-dialog';
import { DeleteConnectionDialog } from './delete-connection-dialog';
import { ConnectionSchemaDialog } from './connection-schema-explorer';

/** Aparência da pílula de status conforme o resultado do último teste. */
function statusConfig(status: string) {
  const s = (status ?? '').toUpperCase();
  if (s === 'OK' || s === 'ACTIVE' || s === 'CONNECTED') {
    return { label: 'OK', className: 'bg-chart-2/10 text-chart-2' };
  }
  if (s === 'ERROR' || s === 'FAILED' || s === 'INACTIVE') {
    return { label: 'Erro', className: 'bg-destructive/10 text-destructive' };
  }
  return { label: 'Não testada', className: 'bg-muted text-muted-foreground' };
}

function EmptyConnections({ hasSearch }: { hasSearch: boolean }) {
  const Icon = hasSearch ? SearchX : Database;
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {hasSearch
            ? 'Nenhuma conexão encontrada'
            : 'Nenhuma conexão cadastrada'}
        </p>
        <p className="mx-auto max-w-xs text-xs text-muted-foreground">
          {hasSearch
            ? 'Ajuste os termos da busca para encontrar a conexão que procura.'
            : 'Cadastre uma conexão PostgreSQL para começar a explorar e consultar dados.'}
        </p>
      </div>
    </div>
  );
}

export function ConnectionsPage() {
  const role = useAuthStore((s) => s.user?.role);
  // RBAC de UI (espelha o backend): manage = criar/editar/excluir.
  const canManage = hasPermission(role, 'connections:manage');

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const { data, isLoading, isError } = useConnections({
    search: debounced,
    pageSize: 50,
  });
  const testConnection = useTestConnection();

  // Estado dos modais (form/excluir/schema).
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);
  const [deleting, setDeleting] = useState<Connection | null>(null);
  const [schemaFor, setSchemaFor] = useState<Connection | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (conn: Connection) => {
    setEditing(conn);
    setFormOpen(true);
  };

  const hasSearch = debounced.trim().length > 0;
  const isEmpty = !isLoading && (data?.connections.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-8">
      <Section index={0}>
        <SectionHeader
          className="mb-0"
          eyebrow="Dados"
          title="Conexões"
          description="Cadastre, teste e explore o schema das conexões PostgreSQL da plataforma."
          actions={
            canManage ? (
              <Button onClick={openCreate} className="gap-2">
                <Plus className="size-4" />
                Nova conexão
              </Button>
            ) : undefined
          }
        />
      </Section>

      <Section
        index={1}
        className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
      >
        <SectionHeader
          eyebrow="Diretório"
          title="Lista de conexões"
          description={
            <>
              <span className="tabular-nums">{data?.total ?? 0}</span> conexã
              {(data?.total ?? 0) === 1 ? 'o' : 'es'} no total.
            </>
          }
          actions={
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, host ou banco…"
                className="rounded-lg pl-8"
              />
            </div>
          }
        />

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              Não foi possível carregar as conexões
            </p>
            <p className="text-xs text-muted-foreground">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
        ) : isEmpty ? (
          <EmptyConnections hasSearch={hasSearch} />
        ) : (
          <div className="overflow-x-auto">
            <TableFluid>
              <TableFluidHeader>
                <TableFluidRow>
                  <TableFluidHead>Conexão</TableFluidHead>
                  <TableFluidHead className="hidden md:table-cell">
                    Host
                  </TableFluidHead>
                  <TableFluidHead>Status</TableFluidHead>
                  <TableFluidHead className="hidden text-right lg:table-cell">
                    Último teste
                  </TableFluidHead>
                  <TableFluidHead className="text-right">Ações</TableFluidHead>
                </TableFluidRow>
              </TableFluidHeader>
              <TableFluidBody>
                {data?.connections.map((conn, i) => {
                  const status = statusConfig(conn.status);
                  const testingThis =
                    testConnection.isPending &&
                    testConnection.variables === conn.id;
                  return (
                    <TableFluidRow key={conn.id} index={i}>
                      <TableFluidCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {conn.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {conn.database} · {conn.username}
                          </p>
                        </div>
                      </TableFluidCell>
                      <TableFluidCell className="hidden text-xs text-muted-foreground md:table-cell">
                        {conn.host}:{conn.port}
                      </TableFluidCell>
                      <TableFluidCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'gap-1.5 rounded-full border-transparent',
                            status.className,
                          )}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {status.label}
                        </Badge>
                      </TableFluidCell>
                      <TableFluidCell className="hidden text-right text-xs tabular-nums text-muted-foreground lg:table-cell">
                        {conn.lastTestedAt
                          ? formatDateTime(conn.lastTestedAt)
                          : '—'}
                      </TableFluidCell>
                      <TableFluidCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => testConnection.mutate(conn.id)}
                            disabled={testingThis}
                            aria-label={`Testar ${conn.name}`}
                            title="Testar conectividade"
                          >
                            <PlugZap
                              className={testingThis ? 'animate-pulse' : ''}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSchemaFor(conn)}
                            aria-label={`Ver schema de ${conn.name}`}
                            title="Explorar schema"
                          >
                            <Table2 />
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEdit(conn)}
                                aria-label={`Editar ${conn.name}`}
                                title="Editar"
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleting(conn)}
                                aria-label={`Excluir ${conn.name}`}
                                title="Excluir"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableFluidCell>
                    </TableFluidRow>
                  );
                })}
              </TableFluidBody>
            </TableFluid>
          </div>
        )}
      </Section>

      {canManage && (
        <ConnectionFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          connection={editing}
        />
      )}
      <DeleteConnectionDialog
        connection={deleting}
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
      <ConnectionSchemaDialog
        connection={schemaFor}
        open={!!schemaFor}
        onOpenChange={(open) => {
          if (!open) setSchemaFor(null);
        }}
      />
    </div>
  );
}
