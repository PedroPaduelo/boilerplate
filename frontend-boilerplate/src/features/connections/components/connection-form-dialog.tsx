import { useWatch } from 'react-hook-form';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack, Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import type { Connection } from '../types';
import { ConnectionFormFields } from './connection-form-fields';
import { useConnectionForm } from './use-connection-form';

/**
 * Cadastro/edição de conexão.
 *
 * ESTRUTURA (cabeçalho fixo → corpo rolável → rodapé fixo): o conteúdo do
 * formulário mora num `LayoutContent isScrollable`, e os botões num
 * `LayoutFooter`.
 *
 * Isso não é enfeite. O diálogo tem `maxHeight` de 75vh, e um formulário
 * empilhado direto dentro dele simplesmente ESTOURA: em tela baixa (ou quando o
 * formulário cresceu, como ao ganhar o seletor de tipo de conexão), "Criar
 * conexão" e "Cancelar" ficam abaixo do corte — invisíveis e inalcançáveis,
 * porque não havia área de rolagem nenhuma. O usuário preenche tudo e não tem
 * como enviar. Com o rodapé fora da área rolável, a ação principal está SEMPRE
 * na tela, e o que rola é só o miolo.
 *
 * SEGURANÇA DO SEGREDO: senha/token sempre mascarados (`type="password"`) e
 * nunca pré-preenchidos — o backend jamais os devolve. Em edição, deixá-los em
 * branco mantém o valor atual (o payload omite o campo).
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
  const type = useWatch({ control: form.control, name: 'type' });

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={640} purpose="form">
      {/*
        O `form` envolve o `Layout` inteiro (e não só o corpo) para que o botão
        de envio, que vive no rodapé, continue sendo o submit do formulário.
      */}
      <form onSubmit={submit} aria-label="Formulário de conexão" noValidate>
        <Layout
          header={
            <DialogHeader
              title={isEdit ? 'Editar conexão' : 'Nova conexão'}
              subtitle={
                isEdit
                  ? 'Atualize os dados da conexão. O segredo só muda se você preencher o campo.'
                  : 'Cadastre uma fonte de dados somente-leitura: um banco PostgreSQL ou uma API de gateway.'
              }
              onOpenChange={onOpenChange}
              hasDivider
            />
          }
          content={
            <LayoutContent isScrollable padding={4}>
              <ConnectionFormFields
                control={form.control}
                errors={form.formState.errors}
                isEdit={isEdit}
                visibility={visibility}
                type={type}
              />
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
                  label={isEdit ? 'Salvar alterações' : 'Criar conexão'}
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
