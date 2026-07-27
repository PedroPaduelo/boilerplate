import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { formatDate } from '@/shared/lib/utils';
import type { User } from '../types';
import { roleLabel, roleVariant, userDisplayName } from '../lib/user-labels';

const COLUMNS = ['Usuário', 'Função', 'Status', 'Criado em', 'Ações'] as const;

export interface UsersTableProps {
  users: User[];
  /** Usado para bloquear a exclusão do próprio usuário. */
  currentUserId: string | undefined;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

/**
 * Diretório de usuários. Dado denso e homogêneo é linha de tabela — nunca um
 * card por item: card é para item discreto, e uma grade de cards idênticos
 * destrói a varredura vertical que a tabela dá de graça.
 */
export function UsersTable({ users, currentUserId, onEdit, onDelete }: UsersTableProps) {
  return (
    <Table density="balanced" dividers="rows" hasHover>
      <TableHeader>
        <TableRow isHeaderRow>
          {COLUMNS.map((column) => (
            <TableHeaderCell key={column} scope="col">
              {column}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const statusLabel = user.isActive ? 'Ativo' : 'Inativo';

          return (
            <TableRow key={user.id}>
              <TableCell>
                <VStack gap={0.5}>
                  <Text weight="semibold" maxLines={1}>
                    {user.name ?? '—'}
                  </Text>
                  <Text type="supporting" maxLines={1}>
                    {user.email}
                  </Text>
                </VStack>
              </TableCell>

              <TableCell>
                <Badge variant={roleVariant(user.role)} label={roleLabel(user.role)} />
              </TableCell>

              <TableCell>
                <HStack gap={2} vAlign="center">
                  <StatusDot
                    variant={user.isActive ? 'success' : 'neutral'}
                    label={statusLabel}
                  />
                  <Text type="body">{statusLabel}</Text>
                </HStack>
              </TableCell>

              <TableCell>
                <Text type="supporting" hasTabularNumbers>
                  {formatDate(user.createdAt)}
                </Text>
              </TableCell>

              <TableCell>
                <HStack gap={1} hAlign="end">
                  <IconButton
                    label={`Editar ${userDisplayName(user)}`}
                    tooltip="Editar usuário"
                    variant="ghost"
                    size="sm"
                    icon={<Icon icon={Pencil} size="sm" />}
                    onClick={() => onEdit(user)}
                  />
                  <IconButton
                    label={`Excluir ${userDisplayName(user)}`}
                    // Desabilitado SEMPRE com motivo: com `tooltip` o botão
                    // continua focável (aria-disabled), então o porquê chega a
                    // quem navega por teclado.
                    tooltip={
                      isSelf
                        ? 'Você não pode excluir o próprio usuário'
                        : 'Excluir usuário'
                    }
                    isDisabled={isSelf}
                    variant="ghost"
                    size="sm"
                    icon={<Icon icon={Trash2} size="sm" />}
                    onClick={() => onDelete(user)}
                  />
                </HStack>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** Esqueleto com a MESMA grade da tabela — sem salto de layout ao carregar. */
export function UsersTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <VStack gap={3} aria-busy="true" aria-label="Carregando usuários">
      {Array.from({ length: rows }).map((_, row) => (
        <HStack key={row} gap={4} vAlign="center">
          <Skeleton width={220} height={20} index={row} />
          <Skeleton width={96} height={20} index={row} />
          <Skeleton width={80} height={20} index={row} />
          <Skeleton width={88} height={20} index={row} />
        </HStack>
      ))}
    </VStack>
  );
}
