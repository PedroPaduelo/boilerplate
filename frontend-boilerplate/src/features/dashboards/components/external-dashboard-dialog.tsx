import { Controller, useWatch } from 'react-hook-form';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { HStack, Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { useDepartments } from '@/shared/hooks/use-departments';
import type { Dashboard } from '../types';
import { useExternalDashboardForm } from './use-external-dashboard-form';

/**
 * Cadastro/edição de RELATÓRIO EXTERNO (legado).
 *
 * Existe para o que já estava pronto antes desta plataforma não ficar de fora
 * da lista: o time continua tendo UM lugar para procurar painel, e o item
 * legado convive com os que nascem aqui. O que ele guarda é só endereço e
 * governança (nome, quem enxerga) — não há layout, porque o conteúdo é mantido
 * lá fora.
 *
 * Mesma estrutura do formulário de conexão (cabeçalho fixo → corpo rolável →
 * rodapé fixo), pelo mesmo motivo: a ação principal nunca pode cair abaixo do
 * corte do diálogo.
 */
export interface ExternalDashboardDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** `null` = cadastro novo; preenchido = edição do relatório já cadastrado. */
  dashboard?: Dashboard | null;
}

const VISIBILITY_OPTIONS = [
  { value: 'PRIVATE', label: 'Privado' },
  { value: 'DEPARTMENT', label: 'Departamento' },
  { value: 'ORG', label: 'Organização' },
];

function errorStatus(message?: string) {
  return message ? ({ type: 'error', message } as const) : undefined;
}

export function ExternalDashboardDialog({
  isOpen,
  onOpenChange,
  dashboard,
}: ExternalDashboardDialogProps) {
  const { form, submit, isEdit, isPending } = useExternalDashboardForm({
    dashboard,
    isOpen,
    onOpenChange,
  });
  const errors = form.formState.errors;
  const visibility = useWatch({ control: form.control, name: 'visibility' });

  const { data: departmentsData, isLoading: isLoadingDepartments } = useDepartments();
  const departments = departmentsData?.departments ?? [];

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={560} purpose="form">
      <form onSubmit={submit} aria-label="Formulário de relatório externo" noValidate>
        <Layout
          header={
            <DialogHeader
              title={isEdit ? 'Editar relatório externo' : 'Cadastrar relatório externo'}
              subtitle="Um relatório mantido fora da plataforma passa a aparecer na lista de dashboards. Ao clicar nele, o endereço abre em uma nova aba."
              onOpenChange={onOpenChange}
              hasDivider
            />
          }
          content={
            <LayoutContent isScrollable padding={4}>
              <FormLayout>
                <Controller
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <TextInput
                      label="Nome do relatório"
                      isRequired
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Ex.: Arrecadação por tributo (legado)"
                      description="É o nome que aparece na lista de dashboards."
                      status={errorStatus(errors.title?.message)}
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name="externalUrl"
                  render={({ field }) => (
                    <TextInput
                      label="Endereço do relatório"
                      isRequired
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="https://analytics.exemplo.gov.br/relatorio"
                      description="Cole o link completo. Sem http:// ou https://, assumimos https://."
                      status={errorStatus(errors.externalUrl?.message)}
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <Selector
                      label="Visibilidade"
                      options={VISIBILITY_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      description="Quem enxerga este item na lista. O acesso ao relatório em si continua sendo controlado por quem o hospeda."
                    />
                  )}
                />

                {visibility === 'DEPARTMENT' ? (
                  <Controller
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <Selector
                        label="Departamento"
                        isRequired
                        isLoading={isLoadingDepartments}
                        isDisabled={!isLoadingDepartments && departments.length === 0}
                        disabledMessage="Nenhum departamento cadastrado — crie um antes de restringir a visibilidade."
                        placeholder="Selecione um departamento"
                        options={departments.map((department) => ({
                          value: department.id,
                          label: department.name,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        status={errorStatus(errors.departmentId?.message)}
                      />
                    )}
                  />
                ) : null}
              </FormLayout>
            </LayoutContent>
          }
          footer={
            <LayoutFooter hasDivider padding={3}>
              <HStack gap={2} hAlign="end">
                <Button
                  label="Cancelar"
                  isDisabled={isPending}
                  onClick={() => onOpenChange(false)}
                />
                <Button
                  type="submit"
                  label={isEdit ? 'Salvar alterações' : 'Cadastrar relatório'}
                  variant="primary"
                  isLoading={isPending}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </form>
    </Dialog>
  );
}
