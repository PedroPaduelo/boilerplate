import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { TextInput } from '@astryxdesign/core/TextInput';
import { ConnectionAccessFields } from './connection-access-fields';
import { errorStatus } from './field-status';
import type { ConnectionFormValues } from './use-connection-form';

/**
 * Campos do formulário de conexão: identificação, endereço e credenciais.
 *
 * Cada erro aparece INLINE no próprio campo (`status`), nunca em toast — o
 * usuário precisa ver QUAL campo falhou. Toast fica para falha da chamada
 * (rede/servidor), que é responsabilidade da mutação.
 */
export interface ConnectionFormFieldsProps {
  control: Control<ConnectionFormValues>;
  errors: FieldErrors<ConnectionFormValues>;
  isEdit: boolean;
  visibility: ConnectionFormValues['visibility'];
}

export function ConnectionFormFields({
  control,
  errors,
  isEdit,
  visibility,
}: ConnectionFormFieldsProps) {
  return (
    <FormLayout>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextInput
            label="Nome"
            isRequired
            value={field.value}
            onChange={field.onChange}
            placeholder="Ex.: Data Warehouse"
            status={errorStatus(errors.name?.message)}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextInput
            label="Descrição"
            isOptional
            value={field.value}
            onChange={field.onChange}
            placeholder="Para que serve esta conexão"
          />
        )}
      />

      <FormLayout direction="horizontal">
        <Controller
          control={control}
          name="host"
          render={({ field }) => (
            <TextInput
              label="Host"
              isRequired
              value={field.value}
              onChange={field.onChange}
              placeholder="db.exemplo.com"
              status={errorStatus(errors.host?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="port"
          render={({ field }) => (
            <NumberInput
              label="Porta"
              isRequired
              isIntegerOnly
              min={1}
              max={65535}
              value={field.value}
              onChange={field.onChange}
              placeholder="5432"
              status={errorStatus(errors.port?.message)}
            />
          )}
        />
      </FormLayout>

      <Controller
        control={control}
        name="database"
        render={({ field }) => (
          <TextInput
            label="Banco de dados"
            isRequired
            value={field.value}
            onChange={field.onChange}
            placeholder="postgres"
            status={errorStatus(errors.database?.message)}
          />
        )}
      />

      <FormLayout direction="horizontal">
        <Controller
          control={control}
          name="username"
          render={({ field }) => (
            <TextInput
              label="Usuário"
              isRequired
              value={field.value}
              onChange={field.onChange}
              placeholder="readonly_user"
              status={errorStatus(errors.username?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextInput
              type="password"
              label="Senha"
              isRequired={!isEdit}
              isOptional={isEdit}
              value={field.value}
              onChange={field.onChange}
              placeholder="••••••••"
              description={isEdit ? 'Em branco mantém a senha atual.' : undefined}
              status={errorStatus(errors.password?.message)}
            />
          )}
        />
      </FormLayout>

      <ConnectionAccessFields
        control={control}
        errors={errors}
        isEdit={isEdit}
        visibility={visibility}
      />
    </FormLayout>
  );
}
