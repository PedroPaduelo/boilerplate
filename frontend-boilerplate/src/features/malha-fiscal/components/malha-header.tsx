/**
 * Abertura da tela: o que é a malha fiscal e de quando é o dado.
 *
 * O carimbo da última carga fica no cabeçalho, e não escondido num rodapé:
 * decisão de fiscalização tomada sobre dado velho é decisão errada, e quem
 * abre a tela precisa ver a idade da base antes de olhar qualquer número.
 */
import { RefreshCw } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Heading, Text } from '@astryxdesign/core/Text';
import { formatNumberBR } from '@/shared/lib/format';
import { tempoRelativo } from '../lib/tempo';

export interface MalhaHeaderProps {
  atualizadoEm: string | undefined;
  registrosAnalisados: number | undefined;
  isFetching: boolean;
  onAtualizar: () => void;
}

export function MalhaHeader({
  atualizadoEm,
  registrosAnalisados,
  isFetching,
  onAtualizar,
}: MalhaHeaderProps) {
  return (
    <HStack gap={4} hAlign="between" vAlign="start" wrap="wrap">
      <VStack gap={1} maxWidth={680}>
        <Text type="supporting">Fiscalização</Text>
        <Heading level={2}>Malha fiscal</Heading>
        <Text type="supporting">
          Cruzamento entre o que foi declarado no PGDAS e o que foi movimentado em NFS-e.
          Selecione um recorte nos gráficos e gere o lote de fiscalização a partir dele.
        </Text>
      </VStack>

      <VStack gap={2} vAlign="end">
        <HStack gap={2} vAlign="center">
          <StatusDot
            variant={isFetching ? 'warning' : 'success'}
            label={isFetching ? 'Apurando' : 'Base sincronizada'}
          />
          <Text type="supporting">
            {isFetching
              ? 'Apurando recorte…'
              : `Base cruzada ${tempoRelativo(atualizadoEm)} · ${formatNumberBR(
                  registrosAnalisados ?? 0,
                  0,
                )} registros`}
          </Text>
        </HStack>
        <Button
          label="Atualizar base"
          size="sm"
          icon={<Icon icon={RefreshCw} />}
          isLoading={isFetching}
          onClick={onAtualizar}
        />
      </VStack>
    </HStack>
  );
}
