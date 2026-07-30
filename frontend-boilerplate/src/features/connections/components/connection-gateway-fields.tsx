import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { TextInput } from '@astryxdesign/core/TextInput';
import { errorStatus } from './field-status';
import type { ConnectionFormValues } from './use-connection-form';

/**
 * Campos de uma conexão via GATEWAY: para onde falar e com que credencial.
 *
 * São só três, e é esse o ponto — o gateway existe justamente para reduzir o
 * cadastro de um banco inalcançável a "URL + token". Host, porta e SSL são
 * DERIVADOS da URL no backend: pedi-los aqui seria pedir ao usuário que
 * repetisse, em três campos, o que ele já digitou em um.
 */
export interface ConnectionGatewayFieldsProps {
  control: Control<ConnectionFormValues>;
  errors: FieldErrors<ConnectionFormValues>;
  isEdit: boolean;
}

export function ConnectionGatewayFields({
  control,
  errors,
  isEdit,
}: ConnectionGatewayFieldsProps) {
  return (
    <>
      <Controller
        control={control}
        name="baseUrl"
        render={({ field }) => (
          <TextInput
            label="URL do gateway"
            isRequired
            value={field.value}
            onChange={field.onChange}
            placeholder="https://gateway.exemplo.com"
            description="Endereço base da API. Os caminhos (/api/gateway/...) são acrescentados automaticamente."
            status={errorStatus(errors.baseUrl?.message)}
          />
        )}
      />
      <Controller
        control={control}
        name="token"
        render={({ field }) => (
          <TextInput
            type="password"
            label="Token de acesso"
            isRequired={!isEdit}
            isOptional={isEdit}
            value={field.value}
            onChange={field.onChange}
            placeholder="••••••••"
            description={
              isEdit
                ? 'Em branco mantém o token atual.'
                : 'Enviado como Bearer em cada chamada. Fica cifrado e nunca é exibido de volta.'
            }
            status={errorStatus(errors.token?.message)}
          />
        )}
      />
      <Controller
        control={control}
        name="database"
        render={({ field }) => (
          <TextInput
            label="Banco de dados"
            isOptional
            value={field.value}
            onChange={field.onChange}
            placeholder="Detectado ao testar a conexão"
            // O gateway informa o nome do banco no /health. Deixar em branco é
            // o caminho recomendado: o dado vem da fonte, não do palpite de
            // quem cadastra.
            description="Deixe em branco para usar o nome que o próprio gateway informar."
            status={errorStatus(errors.database?.message)}
          />
        )}
      />
    </>
  );
}
