import { Controller, type Control } from 'react-hook-form';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import type { ConnectionFormValues } from './use-connection-form';

/**
 * Escolha do TIPO de fonte — a primeira decisão do cadastro, porque ela muda
 * todos os campos seguintes.
 *
 * `RadioList` (e não um `Selector`) de propósito: são duas opções que precisam
 * ser COMPARADAS, e a diferença entre elas não cabe no rótulo. Num dropdown o
 * usuário leria "Gateway HTTP (API)" e teria que adivinhar quando usar; aqui as
 * duas descrições ficam visíveis lado a lado no momento da escolha.
 *
 * Em EDIÇÃO o campo fica desabilitado: trocar o tipo de uma conexão existente
 * trocaria também o significado do segredo guardado (senha vira token) e de
 * todo o endereço. Quem precisa de outro tipo cria outra conexão — o caminho
 * honesto, em vez de uma migração silenciosa que quebraria os gráficos que já
 * dependem dela.
 */
export interface ConnectionTypeFieldProps {
  control: Control<ConnectionFormValues>;
  isEdit: boolean;
}

export function ConnectionTypeField({ control, isEdit }: ConnectionTypeFieldProps) {
  return (
    <Controller
      control={control}
      name="type"
      render={({ field }) => (
        <RadioList
          label="Tipo de conexão"
          isRequired
          orientation="horizontal"
          isDisabled={isEdit}
          disabledMessage="O tipo não muda depois de criada — cadastre uma nova conexão."
          value={field.value}
          onChange={field.onChange}
        >
          <RadioListItem
            label="Banco de dados"
            value="POSTGRES"
            description="Conexão direta a um PostgreSQL (host, usuário e senha)."
          />
          <RadioListItem
            label="API (gateway)"
            value="API_GATEWAY"
            description="Lê o banco por HTTP, via um gateway com token — para bases fora do alcance da rede."
          />
        </RadioList>
      )}
    />
  );
}
