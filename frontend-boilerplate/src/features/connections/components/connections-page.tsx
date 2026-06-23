import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { Button, Skeleton, Section, SectionHeader } from '@/components/ui';
import { DbOverviewGrid } from '@/components/ui/db-overview-grid';
import type {
  DatabaseInstance,
  DbEnvironment,
  DbStatus,
} from '@/components/ui/db-overview-grid-types';
import { useAuthStore } from '@/features/auth/store';
import { hasPermission } from '@/shared/lib/rbac';

import { useConnections } from '../hooks';
import type { Connection } from '../types';
import { ConnectionFormDialog } from './connection-form-dialog';

/** Status de conectividade do backend → status visual do tile. */
function toTileStatus(status: string): DbStatus {
  const s = (status ?? '').toUpperCase();
  if (s === 'OK' || s === 'ACTIVE' || s === 'CONNECTED') return 'healthy';
  if (s === 'ERROR' || s === 'FAILED' || s === 'INACTIVE') return 'offline';
  return 'degraded';
}

/** Deriva o "ambiente" a partir do nome/banco (heurística leve). */
function toTileEnv(conn: Connection): DbEnvironment {
  const hay = `${conn.name} ${conn.database}`.toLowerCase();
  if (hay.includes('homolog')) return 'homolog';
  if (hay.includes('staging') || hay.includes('hml')) return 'staging';
  if (hay.includes('dev') || hay.includes('local')) return 'dev';
  return 'prod';
}

/** Mapeia uma Connection para o shape de tile do DbOverviewGrid. */
function toInstance(conn: Connection): DatabaseInstance {
  return {
    id: conn.id,
    name: conn.name,
    role: conn.description || conn.database,
    env: toTileEnv(conn),
    engine: 'postgresql',
    host: conn.host,
    port: conn.port,
    version: '',
    sizeMB: 0,
    maxConnections: 0,
    currentConnections: 0,
    status: toTileStatus(conn.status),
    queriesPerSec: 0,
    slowQueriesCount: 0,
    transactionsPerSec: 0,
    cacheHitRatio: 0,
    lastBackupAt: conn.lastTestedAt ?? undefined,
    topTables: [],
  };
}

export function ConnectionsPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  // RBAC de UI (espelha o backend): manage = criar/editar/excluir.
  const canManage = hasPermission(role, 'connections:manage');

  const { data, isLoading, isError } = useConnections({ pageSize: 100 });
  const [formOpen, setFormOpen] = useState(false);

  const databases = (data?.connections ?? []).map(toInstance);

  return (
    <div className="flex flex-col gap-8">
      <Section index={0}>
        <SectionHeader
          className="mb-0"
          eyebrow="Dados"
          title="Conexões"
          description="Explore as conexões PostgreSQL da plataforma. Clique em um card para abrir o workbench (schema, índices, FKs e query runner)."
          actions={
            canManage ? (
              <Button onClick={() => setFormOpen(true)} className="gap-2">
                <Plus className="size-4" />
                Nova conexão
              </Button>
            ) : undefined
          }
        />
      </Section>

      <Section index={1}>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              Não foi possível carregar as conexões
            </p>
            <p className="text-xs text-muted-foreground">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
        ) : (
          <DbOverviewGrid
            databases={databases}
            sortBy="name"
            onDatabaseClick={(id) => navigate(`/connections/${id}`)}
          />
        )}
      </Section>

      {canManage && (
        <ConnectionFormDialog open={formOpen} onOpenChange={setFormOpen} connection={null} />
      )}
    </div>
  );
}
