'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { formatDate } from '@/shared/lib/utils';
import type { User, UserRole, UserStatus, UserFilters } from '../types';

interface UsersTableProps {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkStatusChange: (ids: string[], status: UserStatus) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  user: 'Usuário',
  editor: 'Editor',
};

const roleBadgeStyles: Record<UserRole, string> = {
  admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20',
  user: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
  editor: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20',
};

const statusLabels: Record<UserStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
};

const statusBadgeStyles: Record<UserStatus, string> = {
  active:
    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const TableSkeleton = () => (
  <div className="space-y-3 p-6">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    ))}
  </div>
);

export function UsersTable({
  users,
  total,
  page,
  totalPages,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkStatusChange,
  onCreate,
  isLoading,
}: UsersTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search, page: 1 });
  };

  const handleRoleChange = (role: string) => {
    onFiltersChange({
      ...filters,
      role: role as UserRole | 'all',
      page: 1,
    });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status as UserStatus | 'all',
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  const handleBulkDelete = () => {
    onBulkDelete(Array.from(selectedIds));
    clearSelection();
  };

  const handleBulkActivate = () => {
    onBulkStatusChange(Array.from(selectedIds), 'active');
    clearSelection();
  };

  const handleBulkDeactivate = () => {
    onBulkStatusChange(Array.from(selectedIds), 'inactive');
    clearSelection();
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Cargo', 'Status', 'Criado em'];
    const rows = users.map((user) => [
      user.name,
      user.email,
      roleLabels[user.role],
      statusLabels[user.status],
      formatDate(user.createdAt),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const startItem = (page - 1) * (filters.limit || 10) + 1;
  const endItem = Math.min(page * (filters.limit || 10), total);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          {/* Title and add button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                {total} usuário{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={exportToCSV}
                title="Exportar CSV"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <Select value={filters.role || 'all'} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk actions bar */}
          {someSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg"
            >
              <span className="text-sm font-medium">
                {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={handleBulkActivate}>
                  <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                  Ativar
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkDeactivate}>
                  <UserX className="mr-1.5 h-3.5 w-3.5" />
                  Desativar
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Excluir
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Limpar
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      data-state={selectedIds.has(user.id) ? 'selected' : undefined}
                    >
                      <td className="p-4 align-middle">
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                          aria-label={`Selecionar ${user.name}`}
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {user.avatar ? (
                              <AvatarImage src={user.avatar} alt={user.name} />
                            ) : null}
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{user.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className={roleBadgeStyles[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge
                          variant="outline"
                          className={statusBadgeStyles[user.status]}
                        >
                          <span
                            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                              user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}
                          />
                          {statusLabels[user.status]}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Mostrando {startItem} a {endItem} de {total} resultado
                  {total !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        // Show first, last, and pages around current
                        if (totalPages <= 7) return true;
                        if (p === 1 || p === totalPages) return true;
                        if (Math.abs(p - page) <= 1) return true;
                        return false;
                      })
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <div key={p} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={page === p ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(p)}
                              className="h-8 w-8 p-0"
                            >
                              {p}
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
