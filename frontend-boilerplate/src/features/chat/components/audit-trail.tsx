/**
 * A trilha de auditoria de UMA resposta: o que o agente fez para chegar nela.
 *
 * Cada passo é uma linha do `ChatToolCalls` do DS, com o passo INTEIRO — alvo,
 * duração, estado e, ao expandir, a evidência (`AuditStepDetail`). Antes só
 * `name` e `status` eram preenchidos: a linha dizia "Executando query" e o
 * usuário tinha de acreditar.
 *
 * Uma instância do `ChatToolCalls` por passo, e não uma só com todos: no modo
 * agrupado o componente ignora a prop `label` e escreve "N tool calls" — texto
 * fixo, em inglês, dentro de uma tela em português. No modo de uma chamada não
 * existe esse cabeçalho, então o resumo (abaixo) é nosso e sai no idioma certo,
 * sem esconder nenhum passo atrás de um "ver mais".
 */
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { ChatToolCalls } from '@astryxdesign/core/Chat';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { Icon } from '@astryxdesign/core/Icon';
import { Spinner } from '@astryxdesign/core/Spinner';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import type { AuditStep, ChatMessageTrail } from '../model';
import { formatDuration, hasStepEvidence, toChatToolCalls } from '../lib/chat-tools';
import { AuditStepDetail } from './audit-step-detail';

export interface AuditTrailProps {
  trail: ChatMessageTrail;
  /** Frase da fase corrente ("Consultando teste · Postgres"), se houver turno em voo. */
  phaseLabel?: string | null;
  /** Turno em andamento: o cabeçalho vira o que está acontecendo agora. */
  isStreaming?: boolean;
}

/**
 * Um passo que APAGA não pode chegar com o mesmo peso de um `SELECT`.
 *
 * Vai no slot `stats`, ao lado do rótulo: o selo aparece na linha fechada, que
 * é onde o usuário que só bateu o olho na resposta vai vê-lo — e entra no nome
 * acessível da linha, então o leitor de tela também anuncia.
 */
function stepStats(step: AuditStep) {
  if (!step.isDestructive) return undefined;
  return (
    <Badge
      variant="error"
      label="Ação destrutiva"
      icon={<Icon icon={AlertTriangle} size="xsm" />}
    />
  );
}

function trailSummary(trail: ChatMessageTrail): string {
  const count = trail.steps.length;
  const elapsed = trail.usage?.elapsedMs;
  const parts = [`${count} ${count === 1 ? 'passo' : 'passos'}`];
  if (elapsed !== undefined) parts.push(formatDuration(elapsed));
  return parts.join(' · ');
}

/** Um passo que falhou precisa ser visível com a trilha FECHADA. */
function failedCount(steps: readonly AuditStep[]): number {
  return steps.filter((step) => step.status === 'error').length;
}

export function AuditTrail({ trail, phaseLabel, isStreaming = false }: AuditTrailProps) {
  const steps = trail.steps;
  const isWorking = isStreaming && Boolean(phaseLabel);

  // Sem passo e sem fase não há o que auditar: a resposta fala por si.
  if (steps.length === 0 && !isWorking) return null;

  const calls = toChatToolCalls(steps, (step) => ({
    stats: stepStats(step),
    // Sem evidência, a linha não abre — expandir para o vazio é pior que não
    // ter o gesto (é o `resultDetail` que torna a linha um `button` no DS).
    resultDetail: hasStepEvidence(step) ? <AuditStepDetail step={step} /> : undefined,
  }));

  const passos = (
    <VStack gap={2}>
      {calls.map((call) => (
        <ChatToolCalls
          key={call.key}
          calls={[call]}
          // Só o turno EM ANDAMENTO anima. Numa conversa já carregada os passos
          // aparecem todos de uma vez: animá-los seria um piscar coletivo que
          // não corresponde a nada acontecendo.
          className={isStreaming ? 'app-step-in' : undefined}
        />
      ))}
    </VStack>
  );

  /**
   * Turno EM ANDAMENTO: a trilha fica aberta e é o próprio indicador de
   * progresso — os passos entram um a um e o usuário vê o trabalho acontecer.
   */
  if (isStreaming) {
    return (
      <VStack gap={2}>
        <HStack gap={2} vAlign="center">
          <Spinner size="sm" />
          <Text type="supporting" color="secondary">
            {isWorking ? phaseLabel : 'Trabalhando…'}
          </Text>
        </HStack>
        {passos}
      </VStack>
    );
  }

  /**
   * Turno CONCLUÍDO: a trilha recolhe.
   *
   * O motivo é de proporção. Numa pergunta como "quantos contatos existem?", a
   * resposta é uma linha — "369 contatos" — e a trilha tem quatro passos. Aberta,
   * ela ocupa quatro vezes mais espaço que a resposta que o usuário veio ler, e
   * a evidência (que existe para ser conferida QUANDO se duvida) passa a
   * atrapalhar a leitura de quem não duvidou.
   *
   * Recolhida, ela continua a um clique — e o resumo no gatilho já entrega o
   * essencial sem abrir: quantos passos, quanto tempo, e se algum falhou.
   *
   * A exceção é justamente a falha: um passo com erro fica anunciado no rótulo
   * (`1 falhou`), porque esconder atrás de um clique um problema que afetou o
   * resultado seria esconder o que mais importa auditar.
   */
  const falhas = failedCount(steps);

  return (
    <Collapsible
      defaultIsOpen={false}
      trigger={
        <HStack gap={2} vAlign="center">
          <Text type="supporting" color="secondary">
            {`Trilha de auditoria · ${trailSummary(trail)}`}
          </Text>
          {falhas > 0 ? (
            <Badge
              variant="warning"
              label={`${falhas} ${falhas === 1 ? 'falhou' : 'falharam'}`}
            />
          ) : null}
        </HStack>
      }
    >
      {passos}
    </Collapsible>
  );
}
