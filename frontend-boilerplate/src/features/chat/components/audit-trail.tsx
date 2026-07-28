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

  return (
    <VStack gap={2}>
      <HStack gap={2} vAlign="center">
        {isStreaming ? <Spinner size="sm" /> : null}
        <Text type="supporting" color="secondary">
          {isWorking ? phaseLabel : `Trilha de auditoria · ${trailSummary(trail)}`}
        </Text>
      </HStack>

      {calls.map((call) => (
        <ChatToolCalls key={call.key} calls={[call]} />
      ))}
    </VStack>
  );
}
