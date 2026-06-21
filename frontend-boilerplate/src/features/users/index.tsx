import { useState } from 'react';
import {
  Users as UsersIcon,
  UserCheck,
  UserX,
  Shield,
  Search,
  SearchX,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useUsers, useUserStats } from './hooks/use-users';
import type { User, UserRole } from './types';
import { UserFormDialog } from './components/user-form-dialog';
import { DeleteUserDialog } from './components/delete-user-dialog';
import {
  KpiCard,
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
import { cn, formatDate } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useAuthStore } from '@/features/auth/store';

// Badges tonalizadas por token semântico do DS (sem paleta crua):
// função e status mapeiam para chart-*/muted, mantendo legibilidade em
// light e dark. Pills com rounded-full e borda transparente.
const roleConfig: Record<UserRole, { label: string; className: string }> = {
  ADMIN: { label: 'Admin', className: 'bg-chart-1/10 text-chart-1' },
  USER: { label: 'Usuário', className: 'bg-muted text-muted-foreground' },
};

function statusConfig(isActive: boolean) {
  return isActive
    ? { label: 'Ativo', className: 'bg-chart-2/10 text-chart-2' }
    : { label: 'Inativo', className: 'bg-muted text-muted-foreground' };
}

function EmptyUsers({ hasSearch }: { hasSearch: boolean }) {
  const Icon = hasSearch ? SearchX : UsersIcon;
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {hasSearch
            ? 'Nenhum usuário encontrado'
            : 'Nenhum usuário cadastrado'}
        </p>
        <p className="mx-auto max-w-xs text-xs text-muted-foreground">
          {hasSearch
            ? 'Ajuste os termos da busca ou verifique a ortografia para encontrar quem você procura.'
            : 'Os usuários do workspace aparecerão aqui assim que forem adicionados.'}
        </p>
      </div>
    </div>
  );
}

export function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const { data: stats } = useUserStats();
  const { data, isLoading } = useUsers({ search: debounced, pageSize: 50 });

  // Estado dos modais de gestão (criar/editar/excluir).
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setFormOpen(true);
  };

  const kpis = [
    { label: 'Total de usuários', value: stats?.total ?? 0, icon: UsersIcon },
    { label: 'Ativos', value: stats?.active ?? 0, icon: UserCheck },
    { label: 'Inativos', value: stats?.inactive ?? 0, icon: UserX },
    { label: 'Admins', value: stats?.admins ?? 0, icon: Shield },
  ];

  const hasSearch = debounced.trim().length > 0;
  const isEmpty = !isLoading && (data?.users.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-8">
      <Section index={0}>
        <SectionHeader
          className="mb-0"
          eyebrow="Gestão de pessoas"
          title="Usuários"
          description="Acompanhe o quadro de usuários, funções e status de acesso do workspace."
          actions={
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" />
              Novo usuário
            </Button>
          }
        />
      </Section>

      <Section
        index={1}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon} />
        ))}
      </Section>

      <Section
        index={2}
        className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
      >
        <SectionHeader
          eyebrow="Diretório"
          title="Lista de usuários"
          description={
            <>
              <span className="tabular-nums">{data?.total ?? 0}</span> usuário
              {(data?.total ?? 0) === 1 ? '' : 's'} no total.
            </>
          }
          actions={
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou email…"
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
        ) : isEmpty ? (
          <EmptyUsers hasSearch={hasSearch} />
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
                  <TableFluidHead className="text-right">Ações</TableFluidHead>
                </TableFluidRow>
              </TableFluidHeader>
              <TableFluidBody>
                {data?.users.map((u, i) => {
                  const status = statusConfig(u.isActive);
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <TableFluidRow key={u.id} index={i}>
                      <TableFluidCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {u.name ?? '—'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </TableFluidCell>
                      <TableFluidCell className="hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full border-transparent',
                            roleConfig[u.role].className,
                          )}
                        >
                          {roleConfig[u.role].label}
                        </Badge>
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
                      <TableFluidCell className="hidden text-right text-xs tabular-nums md:table-cell">
                        {formatDate(u.createdAt)}
                      </TableFluidCell>
                      <TableFluidCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(u)}
                            aria-label={`Editar ${u.name ?? u.email}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleting(u)}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? 'Você não pode excluir o próprio usuário'
                                : undefined
                            }
                            aria-label={`Excluir ${u.name ?? u.email}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 />
                          </Button>
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

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
      />
      <DeleteUserDialog
        user={deleting}
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
