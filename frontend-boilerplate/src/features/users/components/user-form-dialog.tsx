import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { useCreateUser, useUpdateUser } from '../hooks/use-users';
import type { User } from '../types';

const baseSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  email: z.string().email('Email inválido'),
  password: z.string(),
  role: z.enum(['ADMIN', 'ANALYST', 'CREATOR', 'VIEWER', 'USER']),
  isActive: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof baseSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) {
  const isEdit = !!user;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isPending = createUser.isPending || updateUser.isPending;

  // Política de senha (back: min 8, 1 letra, 1 número). Em edição a senha é
  // opcional — vazio mantém a atual; se preenchida, precisa cumprir a regra.
  const schema = useMemo(
    () =>
      baseSchema.superRefine((val, ctx) => {
        const pwd = val.password;
        if (isEdit && pwd.length === 0) return;
        if (pwd.length < 8) {
          ctx.addIssue({
            code: 'custom',
            path: ['password'],
            message: 'Mínimo 8 caracteres',
          });
        } else if (!/[A-Za-z]/.test(pwd)) {
          ctx.addIssue({
            code: 'custom',
            path: ['password'],
            message: 'Precisa de ao menos uma letra',
          });
        } else if (!/[0-9]/.test(pwd)) {
          ctx.addIssue({
            code: 'custom',
            path: ['password'],
            message: 'Precisa de ao menos um número',
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
      email: '',
      password: '',
      role: 'USER',
      isActive: 'active',
    },
  });

  // Reidrata o form sempre que abre (ou troca o usuário em edição).
  useEffect(() => {
    if (open) {
      reset({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        role: user?.role ?? 'USER',
        isActive: user?.isActive === false ? 'inactive' : 'active',
      });
    }
  }, [open, user, reset]);

  const onSubmit = (data: FormData) => {
    if (isEdit && user) {
      updateUser.mutate(
        {
          id: user.id,
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.isActive === 'active',
          ...(data.password ? { password: data.password } : {}),
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createUser.mutate(
        {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar usuário' : 'Novo usuário'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados do usuário. Deixe a senha em branco para mantê-la.'
              : 'Preencha os dados para criar um novo usuário no workspace.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Nome completo" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@dominio.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Função</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="ANALYST">Analista</SelectItem>
                      <SelectItem value="CREATOR">Criador</SelectItem>
                      <SelectItem value="VIEWER">Visualizador</SelectItem>
                      <SelectItem value="USER">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

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
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

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
                  : 'Criar usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
