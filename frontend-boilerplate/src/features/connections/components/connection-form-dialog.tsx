import { useWatch } from 'react-hook-form';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import type { Connection } from '../types';
import { ConnectionFormFields } from './connection-form-fields';
import { useConnectionForm } from './use-connection-form';

/**
 * Cadastro/edição de conexão.
 *
 * SEGURANÇA DA SENHA: campo sempre mascarado (`type="password"`) e nunca
 * pré-preenchido — o backend jamais devolve a senha. Em edição, deixá-la em
 * branco mantém a atual (o payload omite `password`).
 */
export interface ConnectionFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  connection?: Connection | null;
}

export function ConnectionFormDialog({
  isOpen,
  onOpenChange,
  connection,
}: ConnectionFormDialogProps) {
  const { form, submit, isEdit, isPending } = useConnectionForm({
    connection,
    isOpen,
    onOpenChange,
  });
  const visibility = useWatch({ control: form.control, name: 'visibility' });

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={640} purpose="form">
      <DialogHeader
        title={isEdit ? 'Editar conexão' : 'Nova conexão'}
        subtitle={
          isEdit
            ? 'Atualize os dados da conexão. A senha só muda se você preencher o campo.'
            : 'Cadastre uma conexão PostgreSQL somente-leitura para a plataforma.'
        }
        onOpenChange={onOpenChange}
        hasDivider
      />
      <form onSubmit={submit} aria-label="Formulário de conexão" noValidate>
        <VStack gap={4}>
          <ConnectionFormFields
            control={form.control}
            errors={form.formState.errors}
            isEdit={isEdit}
            visibility={visibility}
          />
          <HStack gap={2} justify="end">
            <Button
              label="Cancelar"
              isDisabled={isPending}
              onClick={() => onOpenChange(false)}
            />
            <Button
              type="submit"
              label={isEdit ? 'Salvar alterações' : 'Criar conexão'}
              variant="primary"
              isLoading={isPending}
            />
          </HStack>
        </VStack>
      </form>
    </Dialog>
  );
}
