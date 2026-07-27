import { useEffect, useId, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from '@astryxdesign/core/Layout';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { useCreateUser, useUpdateUser } from '../hooks/use-users';
import { buildUserFormSchema, type UserFormData } from '../lib/user-form-schema';
import type { User } from '../types';
import { UserFormFields } from './user-form-fields';

export interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

/**
 * Criação/edição de usuário. `purpose="form"` impede que um clique fora feche o
 * diálogo e jogue fora o que foi digitado.
 */
export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEdit = !!user;
  const formId = useId();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { reset: resetCreate } = createUser;
  const { reset: resetUpdate } = updateUser;

  const mutation = isEdit ? updateUser : createUser;
  const schema = useMemo(() => buildUserFormSchema(isEdit), [isEdit]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', role: 'USER', isActive: true },
  });

  // Reidrata o form e limpa erro de submit anterior sempre que abre (ou troca o
  // usuário em edição) — banner velho em diálogo novo confunde mais que ajuda.
  useEffect(() => {
    if (!open) return;
    resetCreate();
    resetUpdate();
    reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      role: user?.role ?? 'USER',
      isActive: user?.isActive !== false,
    });
  }, [open, user, reset, resetCreate, resetUpdate]);

  const onSubmit = (data: UserFormData) => {
    // Só fecha quando deu certo: se falhar, o banner de erro precisa continuar
    // visível com os dados preenchidos.
    const close = { onSuccess: () => onOpenChange(false) };

    if (isEdit && user) {
      updateUser.mutate(
        {
          id: user.id,
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.isActive,
          ...(data.password ? { password: data.password } : {}),
        },
        close,
      );
      return;
    }

    createUser.mutate(
      { name: data.name, email: data.email, password: data.password, role: data.role },
      close,
    );
  };

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange} purpose="form" width={480}>
      <Layout
        header={
          <DialogHeader
            title={isEdit ? 'Editar usuário' : 'Novo usuário'}
            subtitle={
              isEdit
                ? 'Atualize os dados do usuário.'
                : 'Preencha os dados para criar um novo usuário no workspace.'
            }
            onOpenChange={onOpenChange}
          />
        }
        content={
          <LayoutContent>
            <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
              <VStack gap={4}>
                {mutation.isError && (
                  <Banner
                    status="error"
                    title={
                      isEdit
                        ? 'Não foi possível salvar'
                        : 'Não foi possível criar o usuário'
                    }
                    description={getApiErrorMessage(
                      mutation.error,
                      'Revise os dados e tente novamente.',
                    )}
                  />
                )}

                <UserFormFields control={control} errors={errors} isEdit={isEdit} />
              </VStack>
            </form>
          </LayoutContent>
        }
        footer={
          <LayoutFooter>
            <HStack gap={2} hAlign="end">
              <Button
                label="Cancelar"
                variant="secondary"
                isDisabled={mutation.isPending}
                onClick={() => onOpenChange(false)}
              />
              <Button
                type="submit"
                form={formId}
                label={isEdit ? 'Salvar alterações' : 'Criar usuário'}
                variant="primary"
                isLoading={mutation.isPending}
              />
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
