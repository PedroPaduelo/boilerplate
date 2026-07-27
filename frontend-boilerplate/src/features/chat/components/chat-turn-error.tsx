/**
 * Falha do agente no meio de um turno.
 *
 * O texto cru do provider ("Invalid JSON response") não diz NADA ao usuário e
 * ainda sugere que a culpa é dele. Fica preservado como detalhe técnico atrás do
 * disclosure do `Banner`, enquanto a mensagem visível explica o que aconteceu e
 * oferece a única ação útil: reenviar a mesma pergunta.
 */
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';

export interface ChatTurnErrorProps {
  /** Mensagem técnica devolvida pelo agente. */
  detail: string;
  /** Ausente quando não há pergunta anterior para reenviar. */
  onRetry?: () => void;
}

export function ChatTurnError({ detail, onRetry }: ChatTurnErrorProps) {
  return (
    <Banner
      status="error"
      title="Não consegui concluir essa resposta"
      description="A conversa com o agente foi interrompida. Sua pergunta continua aqui — pode tentar de novo."
      endContent={
        onRetry ? (
          <Button size="sm" label="Tentar de novo" onClick={onRetry} />
        ) : undefined
      }
    >
      <Text type="code">{detail}</Text>
    </Banner>
  );
}
