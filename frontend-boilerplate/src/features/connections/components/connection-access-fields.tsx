import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { Selector } from '@astryxdesign/core/Selector';
import { Switch } from '@astryxdesign/core/Switch';
import { useDepartments } from '../hooks';
import { SSL_MODES, type ConnectionFormValues } from './use-connection-form';
import { errorStatus } from './field-status';

/**
 * Bloco de acesso do formulário: SSL, quem enxerga a conexão e se ela está
 * ativa. Separado dos campos de endereço/credencial porque são decisões de
 * governança — e para nenhum dos dois arquivos virar um monolito.
 */
export interface ConnectionAccessFieldsProps {
  control: Control<ConnectionFormValues>;
  errors: FieldErrors<ConnectionFormValues>;
  isEdit: boolean;
  visibility: ConnectionFormValues['visibility'];
}

const VISIBILITY_OPTIONS = [
  { value: 'PRIVATE', label: 'Privada' },
  { value: 'DEPARTMENT', label: 'Departamento' },
  { value: 'ORG', label: 'Organização' },
];

/**
 * As três opções de ambiente. Ordenadas do mais inofensivo para o mais
 * sensível, e SEM opção pré-selecionada: o campo existe justamente para acabar
 * com o ambiente adivinhado, então um default aqui recriaria o problema em
 * outro lugar — quem cadastra precisa escolher.
 */
const ENVIRONMENT_OPTIONS = [
  { value: 'DEV', label: 'Dev' },
  { value: 'HOMOLOG', label: 'Homologação' },
  { value: 'PRODUCTION', label: 'Produção' },
];

export function ConnectionAccessFields({
  control,
  errors,
  isEdit,
  visibility,
}: ConnectionAccessFieldsProps) {
  const { data: departmentsData, isLoading: isLoadingDepartments } = useDepartments();
  const departments = departmentsData?.departments ?? [];

  return (
    <>
      <Controller
        control={control}
        name="environment"
        render={({ field }) => (
          <Selector
            label="Ambiente"
            isRequired
            placeholder="Selecione o ambiente"
            description="Define o rótulo que a equipe vê ao abrir esta conexão."
            options={ENVIRONMENT_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            status={errorStatus(errors.environment?.message)}
          />
        )}
      />

      <FormLayout direction="horizontal">
        <Controller
          control={control}
          name="sslMode"
          render={({ field }) => (
            <Selector
              label="SSL"
              options={SSL_MODES}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="visibility"
          render={({ field }) => (
            <Selector
              label="Visibilidade"
              options={VISIBILITY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </FormLayout>

      {visibility === 'DEPARTMENT' ? (
        <Controller
          control={control}
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

      {isEdit ? (
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch
              label="Conexão ativa"
              description="Conexões inativas não podem ser testadas nem consultadas."
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      ) : null}
    </>
  );
}
