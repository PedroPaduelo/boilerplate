/**
 * Rodapé de uma resposta do agente: horário, consumo e o que dá para FAZER com
 * ela — copiar, refazer e dizer se prestou.
 *
 * Fica no slot `metadata` do `ChatMessageBubble`, então alinha com o texto e
 * some do caminho: são controles de apoio, não a manchete. O consumo do turno
 * (tokens/tempo) entra na mesma linha, em texto de apoio — número de token é
 * informação de rodapé; promovê-lo a destaque disputaria atenção com a
 * resposta, que é o que o usuário veio ler.
 *
 * O feedback é ESTADO LOCAL + callback: quem persiste é outra camada. Enquanto
 * ela não existe, o botão continua honesto (registra a escolha na tela e avisa
 * quem quiser ouvir) em vez de fingir que salvou.
 */
import { useState } from 'react';
import { Copy, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ChatMessageMetadata } from '@astryxdesign/core/Chat';
import { HStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { formatTime } from '@/shared/lib/utils';
import { ToggleButton } from '@astryxdesign/core/ToggleButton';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import type { ChatTurnUsage } from '../model';

/** Voto do usuário sobre a resposta. `null` = retirou o voto. */
export type MessageFeedback = 'up' | 'down';

export interface MessageActionsProps {
  /** Markdown CRU da resposta — é exatamente o que vai para a área de transferência. */
  content: string;
  /** ISO de quando a resposta chegou. Ausente = sem horário (nunca "agora" chutado). */
  createdAt?: string;
  /** Consumo do turno. Ausente na maioria dos turnos antigos — e tudo bem. */
  usage?: ChatTurnUsage;
  /** Reenvia a pergunta que gerou esta resposta. Ausente = sem "refazer". */
  onRetry?: () => void;
  /** Recebe o voto (ou `null` ao desmarcar). Ausente = sem botões de feedback. */
  onFeedback?: (feedback: MessageFeedback | null) => void;
}

const FEEDBACK_CONFIRMATION: Record<MessageFeedback, string> = {
  up: 'Marcada como útil.',
  down: 'Marcada como não útil.',
};

function formatDuration(elapsedMs: number): string {
  if (elapsedMs < 1000) return `${Math.round(elapsedMs)} ms`;
  return `${(elapsedMs / 1000).toFixed(1).replace('.', ',')} s`;
}

/** "1.240 tokens · 3,4 s · 5 passos" — ou nada, quando não há o que contar. */
function formatUsage(usage: ChatTurnUsage): string | null {
  const parts: string[] = [];

  const tokens = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
  if (tokens > 0) parts.push(`${tokens.toLocaleString('pt-BR')} tokens`);
  if (usage.elapsedMs != null && usage.elapsedMs > 0) {
    parts.push(formatDuration(usage.elapsedMs));
  }
  if (usage.steps != null && usage.steps > 0) {
    parts.push(`${usage.steps} ${usage.steps === 1 ? 'passo' : 'passos'}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function MessageActions({
  content,
  createdAt,
  usage,
  onRetry,
  onFeedback,
}: MessageActionsProps) {
  const toast = useAppToast();
  const [feedback, setFeedback] = useState<MessageFeedback | null>(null);

  const usageLabel = usage ? formatUsage(usage) : null;
  const canCopy = content.trim().length > 0;

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      toast.error('Este navegador não permite copiar automaticamente.');
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Resposta copiada em markdown.');
    } catch {
      toast.error('Não foi possível copiar a resposta.');
    }
  };

  const handleFeedback = (vote: MessageFeedback, isPressed: boolean) => {
    const next = isPressed ? vote : null;
    setFeedback(next);
    onFeedback?.(next);
  };

  return (
    <ChatMessageMetadata
      // `formatTime` em vez do `Timestamp` do DS: ele formata pelo locale do
      // NAVEGADOR, e num navegador em inglês o horário saía "9:10 AM" no meio
      // de uma tela em português. O elemento `<time>` semântico é preservado.
      timestamp={
        createdAt ? <time dateTime={createdAt}>{formatTime(createdAt)}</time> : undefined
      }
      footer={
        <HStack gap={1} vAlign="center" wrap="wrap">
          {usageLabel ? (
            <Text type="supporting">
              <VisuallyHidden>Consumo desta resposta: </VisuallyHidden>
              {usageLabel}
            </Text>
          ) : null}

          {canCopy ? (
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Icon icon={Copy} />}
              label="Copiar resposta"
              tooltip="Copiar em markdown"
              onClick={() => void handleCopy()}
            />
          ) : null}

          {onRetry ? (
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Icon icon={RefreshCw} />}
              label="Refazer resposta"
              tooltip="Perguntar de novo"
              onClick={onRetry}
            />
          ) : null}

          {onFeedback ? (
            <>
              <ToggleButton
                size="sm"
                isIconOnly
                icon={<Icon icon={ThumbsUp} />}
                label="Marcar resposta como útil"
                isPressed={feedback === 'up'}
                onPressedChange={(isPressed) => handleFeedback('up', isPressed)}
              />
              <ToggleButton
                size="sm"
                isIconOnly
                icon={<Icon icon={ThumbsDown} />}
                label="Marcar resposta como não útil"
                isPressed={feedback === 'down'}
                onPressedChange={(isPressed) => handleFeedback('down', isPressed)}
              />
              {/* O `aria-pressed` do botão marca o estado para quem usa leitor de
                  tela; esta frase o repete em TEXTO, para quem não distingue o
                  realce por cor do botão pressionado. */}
              {feedback ? (
                <Text type="supporting" role="status">
                  {FEEDBACK_CONFIRMATION[feedback]}
                </Text>
              ) : null}
            </>
          ) : null}
        </HStack>
      }
    />
  );
}
