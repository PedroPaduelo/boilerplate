import { useEffect, useRef, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSaveExternalDashboard } from '../hooks';
import { isSafeExternalUrl, normalizeExternalUrl } from '../lib/external-dashboard';
import type { Dashboard } from '../types';

/**
 * Estado e validação do cadastro de RELATÓRIO EXTERNO (react-hook-form + zod).
 *
 * Separado da UI pelo mesmo motivo do formulário de conexão: as regras aqui têm
 * consequência (o endereço vira um link que a equipe inteira vai clicar), então
 * elas merecem viver isoladas e testáveis, sem markup em volta.
 *
 * O endereço é NORMALIZADO antes de validar: o erro mais comum é colar o
 * domínio sem `https://`, e recusar isso com "URL inválida" seria implicância —
 * o dado está certo, falta só o esquema.
 */
const externalDashboardSchema = z
  .object({
    title: z.string().trim().min(1, 'Informe o nome do relatório'),
    externalUrl: z.string().trim().min(1, 'Informe o endereço do relatório'),
    visibility: z.enum(['PRIVATE', 'DEPARTMENT', 'ORG']),
    departmentId: z.string(),
  })
  .superRefine((values, ctx) => {
    if (
      values.externalUrl &&
      !isSafeExternalUrl(normalizeExternalUrl(values.externalUrl))
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['externalUrl'],
        message: 'O endereço deve ser um link http:// ou https://',
      });
    }
    if (values.visibility === 'DEPARTMENT' && !values.departmentId) {
      ctx.addIssue({
        code: 'custom',
        path: ['departmentId'],
        message: 'Selecione um departamento',
      });
    }
  });

export type ExternalDashboardFormValues = z.infer<typeof externalDashboardSchema>;

export interface UseExternalDashboardFormOptions {
  /** `null` = cadastro novo; preenchido = edição do relatório já cadastrado. */
  dashboard?: Dashboard | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function useExternalDashboardForm({
  dashboard,
  isOpen,
  onOpenChange,
}: UseExternalDashboardFormOptions) {
  const isEdit = !!dashboard;
  const save = useSaveExternalDashboard();

  const form = useForm<ExternalDashboardFormValues>({
    resolver: zodResolver(externalDashboardSchema),
    defaultValues: {
      title: '',
      externalUrl: '',
      // Legado existe para ser ACHADO por quem já usava: o padrão é a
      // organização inteira enxergar. Quem quiser restringir, restringe.
      visibility: 'ORG',
      departmentId: '',
    },
  });

  const { reset } = form;
  useEffect(() => {
    if (!isOpen) return;
    reset({
      title: dashboard?.title ?? '',
      externalUrl: dashboard?.externalUrl ?? '',
      visibility: dashboard?.visibility ?? 'ORG',
      departmentId: dashboard?.departmentId ?? '',
    });
  }, [isOpen, dashboard, reset]);

  /**
   * Trava de envio DUPLO — `ref`, não estado.
   *
   * Flagrado em teste no navegador: dois cliques no botão a ~100ms criaram DOIS
   * relatórios idênticos. `isPending` da mutação só protege depois que o React
   * re-renderiza; entre o 1º clique e esse re-render existe uma janela em que o
   * handler roda de novo. Um `ref` fecha essa janela porque muda na mesma
   * batida do evento — e cadastro duplicado é caro: quem consome a lista vê o
   * mesmo relatório duas vezes e não sabe qual apagar.
   */
  const inFlight = useRef(false);

  const onValid = (values: ExternalDashboardFormValues) => {
    if (inFlight.current) return;
    inFlight.current = true;
    save.mutate(
      {
        id: dashboard?.id,
        title: values.title.trim(),
        externalUrl: normalizeExternalUrl(values.externalUrl),
        visibility: values.visibility,
        departmentId:
          values.visibility === 'DEPARTMENT' ? values.departmentId || null : null,
      },
      {
        // Fecha só quando dá certo. Se o backend recusar (URL inválida,
        // permissão), o diálogo continua aberto com o que foi digitado — o
        // toast diz o motivo e a pessoa corrige, em vez de redigitar tudo.
        onSuccess: () => onOpenChange(false),
        // Libera a trava também no ERRO: senão o diálogo ficaria aberto e
        // inerte, sem jeito de tentar de novo.
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  };

  /**
   * Handler do `<form onSubmit>`. O `handleSubmit` do react-hook-form é montado
   * AQUI (dentro do evento), e não no corpo do hook: assim a trava acima só é
   * lida em event handler — que é onde `ref` pode ser lido — em vez de durante
   * o render.
   */
  const submit = (event: FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(onValid)(event);
  };

  return { form, submit, isEdit, isPending: save.isPending };
}
