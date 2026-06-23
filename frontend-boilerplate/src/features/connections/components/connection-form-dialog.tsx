import { useEffect, useMemo } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  useCreateConnection,
  useDepartments,
  useUpdateConnection,
} from '../hooks';
import type { Connection } from '../types';

const SSL_MODES = ['require', 'disable', 'prefer', 'verify-ca', 'verify-full'];

const baseSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  description: z.string().optional(),
  host: z.string().min(1, 'Informe o host'),
  port: z
    .number({ message: 'Porta inválida' })
    .int('Porta inválida')
    .min(1, 'Porta inválida')
    .max(65535, 'Porta inválida'),
  database: z.string().min(1, 'Informe o banco de dados'),
  username: z.string().min(1, 'Informe o usuário'),
  password: z.string(),
  sslMode: z.string().min(1),
  visibility: z.enum(['PRIVATE', 'DEPARTMENT', 'ORG']),
  departmentId: z.string().optional(),
  isActive: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof baseSchema>;

export interface ConnectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: Connection | null;
}

/**
 * Formulário de cadastro/edição de conexão (react-hook-form + zod).
 *
 * SEGURANÇA DA SENHA: o campo é sempre `type="password"` (mascarado) e nunca é
 * pré-preenchido — o backend jamais devolve a senha. Em EDIÇÃO, deixar a senha
 * em branco mantém a atual (o payload omite `password`); preenchida, troca.
 */
export function ConnectionFormDialog({
  open,
  onOpenChange,
  connection,
}: ConnectionFormDialogProps) {
  const isEdit = !!connection;
  const createConnection = useCreateConnection();
  const updateConnection = useUpdateConnection();
  const { data: departmentsData } = useDepartments();
  const departments = departmentsData?.departments ?? [];
  const isPending = createConnection.isPending || updateConnection.isPending;

  // Senha obrigatória só na criação. Em edição, vazio = mantém a atual.
  // Departamento obrigatório quando a visibilidade é DEPARTMENT.
  const schema = useMemo(
    () =>
      baseSchema.superRefine((val, ctx) => {
        if (!isEdit && val.password.trim().length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['password'],
            message: 'Informe a senha',
          });
        }
        if (val.visibility === 'DEPARTMENT' && !val.departmentId) {
          ctx.addIssue({
            code: 'custom',
            path: ['departmentId'],
            message: 'Selecione um departamento',
          });
        }
      }),
    [isEdit],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
      sslMode: 'require',
      visibility: 'DEPARTMENT',
      departmentId: '',
      isActive: 'active',
    },
  });

  const visibility = useWatch({ control, name: 'visibility' });

  useEffect(() => {
    if (open) {
      reset({
        name: connection?.name ?? '',
        description: connection?.description ?? '',
        host: connection?.host ?? '',
        port: connection?.port ?? 5432,
        database: connection?.database ?? '',
        username: connection?.username ?? '',
        // Nunca reidrata senha — sempre em branco.
        password: '',
        sslMode: connection?.sslMode ?? 'require',
        visibility: connection?.visibility ?? 'DEPARTMENT',
        departmentId: connection?.departmentId ?? '',
        isActive: connection?.isActive === false ? 'inactive' : 'active',
      });
    }
  }, [open, connection, reset]);

  const onSubmit = (data: FormData) => {
    const departmentId =
      data.visibility === 'DEPARTMENT' ? (data.departmentId ?? null) : null;

    if (isEdit && connection) {
      updateConnection.mutate(
        {
          id: connection.id,
          name: data.name,
          description: data.description?.trim() ? data.description : null,
          host: data.host,
          port: data.port,
          database: data.database,
          username: data.username,
          sslMode: data.sslMode,
          visibility: data.visibility,
          departmentId,
          isActive: data.isActive === 'active',
          // Só envia a senha se preenchida (vazio = não troca).
          ...(data.password.trim() ? { password: data.password } : {}),
        },
        { onSettled: () => onOpenChange(false) },
      );
    } else {
      createConnection.mutate(
        {
          name: data.name,
          description: data.description?.trim() ? data.description : null,
          type: 'POSTGRES',
          host: data.host,
          port: data.port,
          database: data.database,
          username: data.username,
          password: data.password,
          sslMode: data.sslMode,
          visibility: data.visibility,
          departmentId,
          isActive: data.isActive === 'active',
        },
        { onSettled: () => onOpenChange(false) },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar conexão' : 'Nova conexão'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados da conexão. Deixe a senha em branco para mantê-la.'
              : 'Cadastre uma conexão PostgreSQL (somente leitura) para uso da plataforma.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          aria-label="connection-form"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex.: Data Warehouse"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              placeholder="Para que serve esta conexão"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="host">Host</Label>
              <Input id="host" placeholder="db.exemplo.com" {...register('host')} />
              {errors.host && (
                <p className="text-xs text-destructive">{errors.host.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Porta</Label>
              <Input
                id="port"
                type="number"
                placeholder="5432"
                {...register('port', { valueAsNumber: true })}
              />
              {errors.port && (
                <p className="text-xs text-destructive">{errors.port.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Banco de dados</Label>
            <Input id="database" placeholder="postgres" {...register('database')} />
            {errors.database && (
              <p className="text-xs text-destructive">
                {errors.database.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                placeholder="readonly_user"
                autoComplete="off"
                {...register('username')}
              />
              {errors.username && (
                <p className="text-xs text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Senha{' '}
                {isEdit && (
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>SSL</Label>
              <Controller
                control={control}
                name="sslMode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SSL_MODES.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {mode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Visibilidade</Label>
              <Controller
                control={control}
                name="visibility"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVATE">Privada</SelectItem>
                      <SelectItem value="DEPARTMENT">Departamento</SelectItem>
                      <SelectItem value="ORG">Organização</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {visibility === 'DEPARTMENT' && (
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Controller
                control={control}
                name="departmentId"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dep) => (
                        <SelectItem key={dep.id} value={dep.id}>
                          {dep.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.departmentId && (
                <p className="text-xs text-destructive">
                  {errors.departmentId.message}
                </p>
              )}
            </div>
          )}

          {isEdit && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="inactive">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Salvando...'
                : isEdit
                  ? 'Salvar alterações'
                  : 'Criar conexão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
