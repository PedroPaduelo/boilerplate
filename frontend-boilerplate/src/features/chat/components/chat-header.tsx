/**
 * Cabeçalho da conversa aberta.
 *
 * É o cabeçalho — não cada mensagem — que apresenta QUEM está do outro lado:
 * avatar do agente, nome e o estado da linha ("online" / "indisponível"),
 * como num aplicativo de mensagens. Foi uma troca deliberada: o avatar por
 * mensagem foi removido (roubava largura do cartão de resposta e desalinhava
 * o eixo esquerdo), então a identidade subiu para cá, onde aparece uma vez e
 * vale para a conversa inteira.
 *
 * O `h1` da tela é o do TopNav do shell, então o título aqui é `level={2}`.
 */
import { MessageSquare, Trash2 } from 'lucide-react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Heading, Text } from '@astryxdesign/core/Text';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';

export interface ChatHeaderProps {
  title: string;
  /** `false` quando a chave do provedor não está configurada no servidor. */
  isAgentReady: boolean | null;
  /** No mobile a lista de conversas vira diálogo — o gatilho mora aqui. */
  isCompact: boolean;
  onOpenList: () => void;
  /** Ausente quando não há conversa aberta para excluir. */
  onDelete?: () => void;
}

/**
 * A linha de status diz a verdade que se sabe: `null` (checagem de saúde ainda
 * no ar) não vira "online" — afirmar disponibilidade antes da resposta seria
 * chute, e este produto vive de não chutar.
 */
function statusLine(isAgentReady: boolean | null) {
  if (isAgentReady === null) {
    return <Text type="supporting">verificando o agente…</Text>;
  }
  if (!isAgentReady) {
    return (
      <HStack gap={1} vAlign="center">
        <StatusDot variant="error" label="Agente indisponível" />
        <Text type="supporting">indisponível — chave do provedor ausente</Text>
      </HStack>
    );
  }
  return (
    <HStack gap={1} vAlign="center">
      <StatusDot variant="success" label="Agente online" isPulsing />
      <Text type="supporting">online · agente com acesso aos seus dados</Text>
    </HStack>
  );
}

export function ChatHeader({
  title,
  isAgentReady,
  isCompact,
  onOpenList,
  onDelete,
}: ChatHeaderProps) {
  return (
    <HStack gap={3} vAlign="center" justify="between">
      <HStack gap={3} vAlign="center">
        {isCompact ? (
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Icon icon={MessageSquare} />}
            label="Ver conversas"
            tooltip="Ver conversas"
            onClick={onOpenList}
          />
        ) : null}
        <Avatar name="IA" size="md" />
        <VStack gap={0}>
          <Heading level={2} maxLines={1}>
            {title}
          </Heading>
          {statusLine(isAgentReady)}
        </VStack>
      </HStack>

      <HStack gap={2} vAlign="center">
        {onDelete ? (
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Icon icon={Trash2} />}
            label="Excluir conversa"
            tooltip="Excluir conversa"
            onClick={onDelete}
          />
        ) : null}
      </HStack>
    </HStack>
  );
}
