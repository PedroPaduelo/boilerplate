import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { ROLE_OPTIONS } from '../lib/user-labels';
import type { UserFormData } from '../lib/user-form-schema';

export interface UserFormFieldsProps {
  control: Control<UserFormData>;
  errors: FieldErrors<UserFormData>;
  /** Em edição a senha é opcional e o status do usuário fica editável. */
  isEdit: boolean;
}

/**
 * Campos do formulário de usuário. Só apresentação: estado, validação e submit
 * ficam no diálogo que o compõe.
 *
 * Erro de campo é INLINE (`status` do próprio controle, que o DS renderiza como
 * `FieldStatus` ligado ao input por `aria-describedby`) — nunca toast.
 */
export function UserFormFields({ control, errors, isEdit }: UserFormFieldsProps) {
  return (
    <FormLayout>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextInput
            label="Nome"
            htmlName="name"
            placeholder="Nome completo"
            isRequired
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            status={
              errors.name ? { type: 'error', message: errors.name.message } : undefined
            }
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextInput
            label="E-mail"
            type="email"
            htmlName="email"
            placeholder="email@dominio.com"
            isRequired
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            status={
              errors.email ? { type: 'error', message: errors.email.message } : undefined
            }
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextInput
            label="Senha"
            type="password"
            htmlName="password"
            placeholder="••••••••"
            description={
              isEdit
                ? 'Deixe em branco para manter a senha atual.'
                : 'Mínimo 8 caracteres, com ao menos uma letra e um número.'
            }
            isOptional={isEdit}
            isRequired={!isEdit}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            status={
              errors.password
                ? { type: 'error', message: errors.password.message }
                : undefined
            }
          />
        )}
      />

      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <Selector
            label="Função"
            options={ROLE_OPTIONS}
            value={field.value}
            onChange={(value) => field.onChange(value)}
          />
        )}
      />

      {isEdit && (
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <CheckboxInput
              label="Usuário ativo"
              description="Usuários inativos não conseguem entrar no workspace."
              value={field.value}
              onChange={(checked) => field.onChange(checked)}
            />
          )}
        />
      )}
    </FormLayout>
  );
}
