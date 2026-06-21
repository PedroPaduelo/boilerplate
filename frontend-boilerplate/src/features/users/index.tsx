import { useState } from 'react';
import {
  Users as UsersIcon,
  UserCheck,
  UserX,
  Shield,
  Search,
} from 'lucide-react';
import { useUsers, useUserStats } from './hooks/use-users';
import type { UserRole, UserStatus } from './types';
import {
  KpiCard,
  Badge,
  Input,
  Skeleton,
  TableFluid,
  TableFluidHeader,
  TableFluidBody,
  TableFluidRow,
  TableFluidHead,
  TableFluidCell,
} from '@/components/ui';
import { formatDate } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/hooks/use-debounce';

const roleVariant = (role: UserRole) =>
  role === 'admin' ? 'default' : role === 'editor' ? 'secondary' : 'outline';
const roleLabel = (role: UserRole) =>
  role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : 'Usuário';
const statusVariant = (status: UserStatus) =>
  status === 'active' ? 'default' : 'destructive';
const statusLabel = (status: UserStatus) =>
  status === 'active' ? 'Ativo' : 'Inativo';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const { data: stats } = useUserStats();
  const { data, isLoading } = useUsers({ search: debounced, limit: 50 });

  const kpis = [
    { label: 'Total de usuários', value: stats?.total ?? 0, icon: UsersIcon },
    { label: 'Ativos', value: stats?.active ?? 0, icon: UserCheck },
    { label: 'Inativos', value: stats?.inactive ?? 0, icon: UserX },
    { label: 'Admins', value: stats?.admins ?? 0, icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon} />
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Usuários</h2>
            <p className="text-xs text-muted-foreground">
              {data?.total ?? 0} usuários no total.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email…"
              className="pl-8"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TableFluid>
              <TableFluidHeader>
                <TableFluidRow>
                  <TableFluidHead>Usuário</TableFluidHead>
                  <TableFluidHead className="hidden sm:table-cell">
                    Função
                  </TableFluidHead>
                  <TableFluidHead>Status</TableFluidHead>
                  <TableFluidHead className="hidden text-right md:table-cell">
                    Criado em
                  </TableFluidHead>
                </TableFluidRow>
              </TableFluidHeader>
              <TableFluidBody>
                {data?.users.map((u, i) => (
                  <TableFluidRow key={u.id} index={i}>
                    <TableFluidCell>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {u.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </TableFluidCell>
                    <TableFluidCell className="hidden sm:table-cell">
                      <Badge variant={roleVariant(u.role)}>
                        {roleLabel(u.role)}
                      </Badge>
                    </TableFluidCell>
                    <TableFluidCell>
                      <Badge variant={statusVariant(u.status)}>
                        {statusLabel(u.status)}
                      </Badge>
                    </TableFluidCell>
                    <TableFluidCell className="hidden text-right text-xs md:table-cell">
                      {formatDate(u.createdAt)}
                    </TableFluidCell>
                  </TableFluidRow>
                ))}
              </TableFluidBody>
            </TableFluid>
            {data?.users.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhum usuário encontrado.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
