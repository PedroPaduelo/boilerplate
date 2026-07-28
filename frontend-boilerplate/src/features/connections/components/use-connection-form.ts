import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateConnection, useUpdateConnection } from '../hooks';
import type { Connection } from '../types';

/**
 * Estado e validação do formulário de conexão (react-hook-form + zod).
 *
 * Separado da UI porque são duas responsabilidades diferentes — e porque as
 * regras aqui têm consequência de segurança: a SENHA nunca é reidratada (o
 * backend não a devolve) e, em edição, campo em branco significa “mantém a
 * atual” — por isso ela só entra no payload quando preenchida.
 */

export const SSL_MODES = ['require', 'disable', 'prefer', 'verify-ca', 'verify-full'];

const connectionSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  description: z.string(),
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
  // String vazia = nada escolhido. O enum puro aceitaria só os três válidos,
  // mas daria a mensagem genérica do Zod ("invalid enum value") no lugar de
  // dizer o que fazer — daí o union com '' e o refine abaixo.
  environment: z.union([z.enum(['DEV', 'HOMOLOG', 'PRODUCTION']), z.literal('')]),
  departmentId: z.string(),
  isActive: z.boolean(),
});

export type ConnectionFormValues = z.infer<typeof connectionSchema>;

export interface UseConnectionFormOptions {
  connection?: Connection | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function useConnectionForm({
  connection,
  isOpen,
  onOpenChange,
}: UseConnectionFormOptions) {
  const isEdit = !!connection;
  const createConnection = useCreateConnection();
  const updateConnection = useUpdateConnection();

  // Senha obrigatória só na criação; departamento obrigatório quando a
  // visibilidade é DEPARTMENT.
  const schema = useMemo(
    () =>
      connectionSchema.superRefine((values, ctx) => {
        if (!isEdit && values.password.trim().length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['password'],
            message: 'Informe a senha',
          });
        }
        if (values.visibility === 'DEPARTMENT' && !values.departmentId) {
          ctx.addIssue({
            code: 'custom',
            path: ['departmentId'],
            message: 'Selecione um departamento',
          });
        }
        if (!values.environment) {
          ctx.addIssue({
            code: 'custom',
            path: ['environment'],
            // Diferente do placeholder de propósito: o placeholder diz o que
            // fazer antes de agir, o erro diz o que faltou depois.
            message: 'Escolha o ambiente do banco',
          });
        }
      }),
    [isEdit],
  );

  const form = useForm<ConnectionFormValues>({
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
      // Vazio de propósito: obriga uma escolha explícita.
      environment: '',
      departmentId: '',
      isActive: true,
    },
  });

  const { reset } = form;
  useEffect(() => {
    if (!isOpen) return;
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
      environment: connection?.environment ?? '',
      departmentId: connection?.departmentId ?? '',
      isActive: connection?.isActive !== false,
    });
  }, [isOpen, connection, reset]);

  const submit = form.handleSubmit((values) => {
    const departmentId =
      values.visibility === 'DEPARTMENT' ? values.departmentId || null : null;
    // O refine acima garante que aqui nunca é '' — o cast só remove o literal
    // vazio que existe para representar "ainda não escolhido" no formulário.
    const environment = values.environment as Exclude<typeof values.environment, ''>;
    const shared = {
      name: values.name,
      description: values.description.trim() ? values.description : null,
      host: values.host,
      port: values.port,
      database: values.database,
      username: values.username,
      sslMode: values.sslMode,
      visibility: values.visibility,
      environment,
      departmentId,
      isActive: values.isActive,
    };
    const close = { onSettled: () => onOpenChange(false) };

    if (isEdit && connection) {
      updateConnection.mutate(
        {
          id: connection.id,
          ...shared,
          ...(values.password.trim() ? { password: values.password } : {}),
        },
        close,
      );
      return;
    }
    createConnection.mutate(
      { ...shared, type: 'POSTGRES', password: values.password },
      close,
    );
  });

  return {
    form,
    submit,
    isEdit,
    isPending: createConnection.isPending || updateConnection.isPending,
  };
}
