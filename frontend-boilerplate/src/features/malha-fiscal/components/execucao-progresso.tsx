/**
 * A execução do lote, etapa a etapa.
 *
 * Sete segundos de "carregando" é tempo suficiente para quem apertou o botão
 * começar a duvidar do que o sistema está fazendo com duzentos CNPJs. Então o
 * processamento se explica: qual etapa está correndo, quais já fecharam e
 * quantos registros foram varridos até agora.
 *
 * Ao terminar, o painel não some — vira o comprovante do lote (número,
 * contribuintes retidos e valor previsto).
 */
import { Check } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Icon } from '@astryxdesign/core/Icon';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Spinner } from '@astryxdesign/core/Spinner';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { formatCompactBRL, formatNumberBR } from '@/shared/lib/format';
import { ETAPAS_GERACAO } from '../lib/dominio';
import type { MalhaGerada } from '../types';

export interface ExecucaoProgressoProps {
  etapaAtual: number;
  progresso: number;
  registros: number;
  malha: MalhaGerada | null;
}

export function ExecucaoProgresso({
  etapaAtual,
  progresso,
  registros,
  malha,
}: ExecucaoProgressoProps) {
  const concluido = malha !== null;

  return (
    <VStack gap={5}>
      <VStack gap={2}>
        <ProgressBar
          label="Progresso da geração da malha"
          value={Math.round(progresso * 100)}
          variant={concluido ? 'success' : 'accent'}
          hasValueLabel
        />
        <Text type="supporting" hasTabularNumbers>
          {formatNumberBR(registros, 0)} registros analisados
        </Text>
      </VStack>

      <VStack gap={3}>
        {ETAPAS_GERACAO.map((etapa, index) => {
          const feita = concluido || index < etapaAtual;
          const corrente = !concluido && index === etapaAtual;

          return (
            <HStack key={etapa.id} gap={3} vAlign="start">
              {/* O estado de cada etapa nunca fica só na cor: há marca de
                  concluído, giro no que corre e ponto neutro no que espera. */}
              {feita ? (
                <Icon icon={Check} size="sm" color="success" />
              ) : corrente ? (
                <Spinner size="sm" label={`Executando: ${etapa.titulo}`} />
              ) : (
                <StatusDot variant="neutral" label="Pendente" />
              )}

              <VStack gap={0.5}>
                <Text weight={corrente ? 'medium' : undefined}>{etapa.titulo}</Text>
                <Text type="supporting">{etapa.detalhe}</Text>
              </VStack>
            </HStack>
          );
        })}
      </VStack>

      {malha ? (
        <Banner
          status="success"
          title={`Malha ${malha.codigo} gerada`}
          description={`${formatNumberBR(malha.totalContribuintes, 0)} contribuintes retidos · ${formatCompactBRL(
            malha.valorPrevisto,
          )} de ISS a recuperar · fluxo de notificação aberto para a equipe responsável.`}
        />
      ) : null}
    </VStack>
  );
}
