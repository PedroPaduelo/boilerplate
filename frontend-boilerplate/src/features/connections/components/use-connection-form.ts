import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateConnection, useUpdateConnection } from '../hooks';
import type { Connection, ConnectionType } from '../types';

/**
 * Estado e validação do formulário de conexão (react-hook-form + zod).
 *
 * Separado da UI porque são duas responsabilidades diferentes — e porque as
 * regras aqui têm consequência de segurança: o SEGREDO (senha do Postgres ou
 * token do gateway) nunca é reidratado (o backend não o devolve) e, em edição,
 * campo em branco significa “mantém o atual” — por isso ele só entra no payload
 * quando preenchido.
 *
 * São DOIS tipos de fonte no mesmo formulário. O que muda entre eles é apenas o
 * bloco de endereço/credencial; nome, ambiente, visibilidade e departamento são
 * os mesmos. Por isso um formulário só, com validação CONDICIONAL — em vez de
 * dois formulários que precisariam ser mantidos em sincronia para sempre.
 */

export const SSL_MODES = ['require', 'disable', 'prefer', 'verify-ca', 'verify-full'];

const connectionSchema = z.object({
  type: z.enum(['POSTGRES', 'API_GATEWAY']),
  name: z.string().min(1, 'Informe o nome'),
  description: z.string(),

  /* --- POSTGRES ---------------------------------------------------------- */
  host: z.string(),
  port: z
    .number({ message: 'Porta inválida' })
    .int('Porta inválida')
    .min(1, 'Porta inválida')
    .max(65535, 'Porta inválida'),
  username: z.string(),
  password: z.string(),
  sslMode: z.string().min(1),

  /* --- API_GATEWAY ------------------------------------------------------- */
  baseUrl: z.string(),
  token: z.string(),

  /* --- comuns ------------------------------------------------------------ */
  // Obrigatório no Postgres; no gateway é opcional (o /health informa o nome).
  database: z.string(),
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

  // Campos obrigatórios dependem do TIPO; o segredo só é obrigatório na
  // criação; departamento é obrigatório quando a visibilidade é DEPARTMENT.
  const schema = useMemo(
    () =>
      connectionSchema
        .superRefine((values, ctx) => {
          const require = (path: keyof ConnectionFormValues, message: string) =>
            ctx.addIssue({ code: 'custom', path: [path], message });

          if (values.type === 'API_GATEWAY') {
            const url = values.baseUrl.trim();
            if (!url) {
              require('baseUrl', 'Informe a URL do gateway');
            } else if (!/^https?:\/\/.+/i.test(url)) {
              // Mensagem específica em vez de "URL inválida": o erro mais comum
              // aqui é colar o domínio sem esquema, e dizer o que falta resolve
              // na hora.
              require('baseUrl', 'A URL deve começar com http:// ou https://');
            }
            if (!isEdit && !values.token.trim()) {
              require('token', 'Informe o token de acesso');
            }
            return;
          }

          if (!values.host.trim()) require('host', 'Informe o host');
          if (!values.database.trim()) require('database', 'Informe o banco de dados');
          if (!values.username.trim()) require('username', 'Informe o usuário');
          if (!isEdit && !values.password.trim()) require('password', 'Informe a senha');
        })
        .superRefine((values, ctx) => {
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
      type: 'POSTGRES',
      name: '',
      description: '',
      host: '',
      port: 5432,
      username: '',
      password: '',
      sslMode: 'require',
      baseUrl: '',
      token: '',
      database: '',
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
      type: (connection?.type as ConnectionType) ?? 'POSTGRES',
      name: connection?.name ?? '',
      description: connection?.description ?? '',
      host: connection?.host ?? '',
      port: connection?.port ?? 5432,
      username: connection?.username ?? '',
      // Nunca reidrata segredo — sempre em branco.
      password: '',
      sslMode: connection?.sslMode ?? 'require',
      baseUrl: connection?.baseUrl ?? '',
      token: '',
      database: connection?.database ?? '',
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

    const common = {
      name: values.name,
      description: values.description.trim() ? values.description : null,
      visibility: values.visibility,
      environment,
      departmentId,
      isActive: values.isActive,
    };

    const isGateway = values.type === 'API_GATEWAY';
    // Só os campos do tipo escolhido vão no payload: mandar `host: ''` num
    // gateway sujaria o registro com endereço que o backend vai derivar da URL.
    const target = isGateway
      ? {
          baseUrl: values.baseUrl.trim(),
          // Em branco, o backend adota o nome que o gateway informar no teste.
          ...(values.database.trim() ? { database: values.database.trim() } : {}),
        }
      : {
          host: values.host,
          port: values.port,
          database: values.database,
          username: values.username,
          sslMode: values.sslMode,
        };
    const secretField = isGateway ? 'token' : 'password';
    const secretValue = isGateway ? values.token : values.password;
    const close = { onSettled: () => onOpenChange(false) };

    if (isEdit && connection) {
      updateConnection.mutate(
        {
          id: connection.id,
          ...common,
          ...target,
          // Em branco mantém o segredo atual.
          ...(secretValue.trim() ? { [secretField]: secretValue } : {}),
        },
        close,
      );
      return;
    }
    createConnection.mutate(
      { ...common, ...target, type: values.type, [secretField]: secretValue },
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
